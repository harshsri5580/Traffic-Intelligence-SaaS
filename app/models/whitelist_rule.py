from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class WhitelistRule(Base):
    __tablename__ = "whitelist_rules"

    id = Column(Integer, primary_key=True, index=True)

    # किस user की whitelist है
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # rule type: ip, asn, isp, ua, domain
    rule_type = Column(String(20), nullable=False, index=True)

    # actual value: e.g. 1.2.3.4 / OVH SAS / ASN12345 / Chrome / example.com
    value = Column(String(255), nullable=False, index=True)

    # optional note (user ke liye)
    note = Column(String(255), nullable=True)

    # timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # relation
    user = relationship("User", backref="whitelist_rules")

    # fast lookup ke liye index
    __table_args__ = (Index("idx_user_rule", "user_id", "rule_type", "value"),)

    def __repr__(self):
        return f"<WhitelistRule(user_id={self.user_id}, type={self.rule_type}, value={self.value})>"
