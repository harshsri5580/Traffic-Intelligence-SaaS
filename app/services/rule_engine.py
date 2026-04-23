from sqlalchemy.orm import Session
import re

from app.models.rule import Rule
from app.services.risk_engine import RiskEngine


class RuleEngine:

    def __init__(self, db: Session, campaign, visitor):

        self.db = db
        self.campaign = campaign
        self.visitor = visitor

        # cache visitor fields for performance
        self._visitor_cache = {}

        # 🔥 NEW: risk cache
        self._risk_score = None

    # =========================================
    # MAIN RULE EVALUATION
    # =========================================

    def evaluate(self):

        rules = (
            self.db.query(Rule)
            .filter(
                Rule.campaign_id == self.campaign.id,
                Rule.is_active == True,
            )
            .order_by(Rule.priority.asc())
            .all()
        )

        # print("TOTAL RULES:", len(rules))

        # 🔥 calculate risk once
        self._risk_score = self._get_risk_score()
        last_fail_reason = None
        for rule in rules:
            # print("CHECKING RULE:", rule.id, rule.name)

            try:

                # ---------------------------------
                # 🔥 GLOBAL RISK OVERRIDE
                # ---------------------------------
                if self._risk_score >= 90:
                    # print("HIGH RISK → FORCE BLOCK")
                    continue

                # ---------------------------------
                # rule without conditions = auto match
                # ---------------------------------
                if not rule.conditions:
                    # print("RULE MATCH (NO CONDITIONS)")
                    return rule, None

                # ---------------------------------
                # 🔥 BOT SCORE THRESHOLD (SMART)
                # ---------------------------------
                dynamic_threshold = self._get_dynamic_bot_threshold()

                rule_threshold = getattr(rule, "bot_threshold", None)

                # 🔥 priority: rule threshold > dynamic > fallback
                final_threshold = (
                    rule_threshold if rule_threshold is not None else dynamic_threshold
                )

                # 🔥 BOT THRESHOLD (FIXED)
                if final_threshold is not None:
                    if self.visitor.bot_score >= final_threshold:
                        last_fail_reason = "bot_score_high"
                        continue  # ❗ skip this rule, don't kill all rules

                # ---------------------------------
                # NORMAL MATCH
                # ---------------------------------
                matched, fail_reason = self._match_rule(rule)

                if matched:
                    return rule, None

                if fail_reason:
                    last_fail_reason = fail_reason

            except Exception as e:
                # print("RULE ERROR:", e)
                continue

        return None, last_fail_reason or "no_matching_rule"

    # =========================================
    # 🔥 RISK HELPER
    # =========================================

    def _get_risk_score(self):

        # 🔥 CACHE (ULTRA FAST)
        if self._risk_score is not None:
            return self._risk_score

        try:
            # 🔥 FAST PATH (no heavy calc for clean users)
            if (
                not getattr(self.visitor, "is_proxy", False)
                and not getattr(self.visitor, "is_datacenter", False)
                and not getattr(self.visitor, "is_vpn", False)
                and getattr(self.visitor, "bot_score", 0) < 30
            ):
                self._risk_score = getattr(self.visitor, "bot_score", 0)
                return self._risk_score

            # 🔥 FULL RISK ENGINE (only when needed)
            engine = RiskEngine(self.visitor, self.campaign)
            self._risk_score = engine.calculate()

            return self._risk_score

        except Exception:
            self._risk_score = getattr(self.visitor, "bot_score", 0)
            return self._risk_score

    def _match_rule(self, rule):

        grouped_conditions = {}

        # 🔹 Group conditions
        for condition in rule.conditions:
            group_key = f"{condition.field}"
            grouped_conditions.setdefault(group_key, []).append(condition)

        group_results = []
        group_fail_map = {}  # 🔥 track per-field result

        # 🔹 Process each group
        for field, conditions in grouped_conditions.items():

            results = []

            for condition in conditions:
                if not condition.value:
                    continue

                visitor_value = self._get_visitor_value(condition.field)

                result = self.evaluate_condition(
                    visitor_value,
                    condition.operator,
                    condition.value,
                )

                results.append(result)

            # 🔥 skip empty
            if not results:
                continue

            group_match = any(results)  # ✅ OR logic inside group
            group_results.append(group_match)

            # 🔥 store fail only if पूरी group fail
            group_fail_map[field] = group_match

        # =========================================
        # 🔥 FINAL RULE LOGIC
        # =========================================

        match_type = getattr(rule, "match_type", "AND")

        if match_type == "AND":
            matched = all(group_results)
        elif match_type == "OR":
            matched = any(group_results)
        else:
            matched = False

        if matched:
            return True, None

        # =========================================
        # ❌ BUILD FAIL REASON (FIXED ✅)
        # =========================================

        fail_reasons = []

        labels = {
            "country": "Country",
            "device": "Device",
            "browser": "Browser",
            "os": "OS",
            "bot_score": "Bot Score",
            "isp": "ISP",
            "asn": "ASN",
        }

        for field, passed in group_fail_map.items():

            # ❌ only if पूरा group fail
            if not passed:
                name = labels.get(field, field)
                fail_reasons.append(f"{name} mismatch")

        reason = ", ".join(fail_reasons) if fail_reasons else "no_rule_match"

        return False, reason

    # =========================================
    # VISITOR FIELD RESOLVER
    # =========================================

    def _get_visitor_value(self, field):

        if field in self._visitor_cache:
            return self._visitor_cache[field]

        field_map = {
            "device": "device_type",
            "device_type": "device_type",
            "browser": "browser",
            "os": "os",
            "country": "country_code",
            "country_code": "country",
            "region": "region",
            "city": "city",
            "timezone": "ip_timezone",
            "asn": "asn",
            "isp": "isp",
            "org": "org",
            "ip_type": "ip_type",
            "connection_type": "connection_type",
            "bot_score": "bot_score",
            "is_bot": "is_bot",
            "is_returning": "is_returning",
            "language": "language",
            "referrer": "referrer",
            "traffic_source": "traffic_source",
            "traffic_medium": "traffic_medium",
            "query_string": "query_string",
            "is_vpn": "is_vpn",
            "is_proxy": "is_proxy",
            "is_datacenter": "is_datacenter",
        }

        visitor_attr = field_map.get(field, field)

        value = getattr(self.visitor, visitor_attr, None)

        self._visitor_cache[field] = value

        return value

    # =========================================
    # CONDITION EVALUATION
    # =========================================

    def evaluate_condition(self, field_value, operator, condition_value):

        if field_value is None:
            return False

        # BOOLEAN
        if isinstance(field_value, bool):

            cond_bool = str(condition_value).lower() in ["true", "1", "yes"]

            if operator == "equals":
                return field_value == cond_bool

            if operator == "not_equals":
                return field_value != cond_bool

        # NUMERIC
        if self._is_number(field_value) and self._is_number(condition_value):

            field_num = float(field_value)
            cond_num = float(condition_value)

            if operator == "greater_than":
                return field_num > cond_num

            if operator == "less_than":
                return field_num < cond_num

            if operator == "greater_or_equal":
                return field_num >= cond_num

            if operator == "less_or_equal":
                return field_num <= cond_num

            if operator == "equals":
                return field_num == cond_num

            if operator == "not_equals":
                return field_num != cond_num

        # STRING
        field_value = str(field_value).strip().lower()
        condition_value = str(condition_value).strip().lower()
        # 🔥 SMART PARTIAL MATCH (CRITICAL FIX)
        if operator == "equals":
            return (
                field_value == condition_value
                or condition_value in field_value
                or field_value in condition_value
            )

        if operator == "not_equals":
            return not (
                field_value == condition_value or condition_value in field_value
            )

        # 🔥 ISP MATCH (CORRECT)
        if operator == "isp_match":
            rule_isps = [v.strip().lower() for v in condition_value.split(",")]
            return any(isp in field_value for isp in rule_isps if isp)

        # 🔥 ASN MATCH (CORRECT)
        if operator == "asn_match":
            rule_asn = []
            for v in condition_value.split(","):
                try:
                    rule_asn.append(int(v.strip()))
                except:
                    continue
            return int(field_value) in rule_asn

        # if operator == "equals":
        #     return field_value == condition_value

        # if operator == "not_equals":
        #     return field_value != condition_value

        if operator == "contains":
            return condition_value in field_value

        if operator == "starts_with":
            return field_value.startswith(condition_value)

        if operator == "ends_with":
            return field_value.endswith(condition_value)

        if operator == "in":
            values = [v.strip().lower() for v in condition_value.split(",")]
            return field_value in values

        if operator == "not_in":
            values = [v.strip().lower() for v in condition_value.split(",")]
            return field_value not in values

        # REGEX
        if operator == "regex":
            try:
                return re.search(condition_value, field_value) is not None
            except re.error:
                return False

        return False

    # =========================================
    # HELPER
    # =========================================

    def _is_number(self, value):

        try:
            float(value)
            return True
        except (ValueError, TypeError):
            return False

    def _get_dynamic_bot_threshold(self):
        """
        Dynamic threshold based on visitor context
        SAFE: fallback to None (means ignore)
        """

        try:
            v = self.visitor

            # 🔥 COUNTRY BASED
            if getattr(v, "country_code", None) == "US":
                return 70

            # 🔥 DATACENTER / PROXY
            if getattr(v, "is_datacenter", False):
                return 40

            if getattr(v, "is_proxy", False) or getattr(v, "is_vpn", False):
                return 50

            # 🔥 RETURNING USER TRUST BOOST
            if getattr(v, "is_returning", False):
                return 80

            # DEFAULT SAFE
            return 60

        except Exception:
            return None
