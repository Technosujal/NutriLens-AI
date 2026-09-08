from sqlalchemy import Column, Integer, DateTime, ForeignKey, func, Date
from sqlalchemy.orm import relationship
from app.database import Base

class WaterLog(Base):
    __tablename__ = "water_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, index=True, nullable=False)
    amount_ml = Column(Integer, default=0)
    created_at = Column(DateTime, default=func.now())

    # Relationships
    user = relationship("User", back_populates="water_logs")
