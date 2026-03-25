from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class RuleCondition(Base):
    __tablename__ = "rule_conditions"

    id = Column(Integer, primary_key=True, index=True)

    rule_id = Column(
        Integer, ForeignKey("rules.id", ondelete="CASCADE"), nullable=False
    )

    # visitor field name (country, device, ip, etc.)
    field = Column(String, nullable=False)

    # equals, not_equals, in, contains, regex, greater_than, etc.
    operator = Column(String, nullable=False)

    # comparison value
    value = Column(String, nullable=False)

    # grouping logic:
    # same group = AND
    # different groups = OR
    condition_group = Column(Integer, default=1)

    rule = relationship("Rule", back_populates="conditions")
