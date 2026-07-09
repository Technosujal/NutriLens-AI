from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base

class WeightHistory(Base):
    __tablename__ = "weight_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    weight_kg = Column(Float, nullable=False)
    date = Column(String, index=True, nullable=False)  # YYYY-MM-DD
    created_at = Column(DateTime, default=func.now())

    # Relationships
    user = relationship("User", back_populates="weight_history")
