from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, func, Date
from sqlalchemy.orm import relationship
from app.database import Base

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, index=True, nullable=False)
    recommendation_text = Column(Text, nullable=False)  # JSON string
    created_at = Column(DateTime, default=func.now())

    # Relationships
    user = relationship("User", back_populates="recommendations")
