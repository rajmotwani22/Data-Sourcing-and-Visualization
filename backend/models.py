from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import enum

Base = declarative_base()

class TaskStatus(enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"

class Task(Base):
    __tablename__ = 'tasks'
    
    id = Column(Integer, primary_key=True)
    status = Column(Enum(TaskStatus), default=TaskStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Filters and parameters for the data sources
    parameters = Column(JSON)
    
    # Relationships
    sales_data = relationship("SalesData", back_populates="task")
    
    def to_dict(self):
        return {
            "id": self.id,
            "status": self.status.value,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "parameters": self.parameters
        }


class SalesData(Base):
    __tablename__ = 'sales_data'
    
    id = Column(Integer, primary_key=True)
    task_id = Column(Integer, ForeignKey('tasks.id'))
    source = Column(String)  # 'source_a' or 'source_b'
    
    # Common fields from both sources
    company = Column(String)
    car_model = Column(String)
    sale_date = Column(DateTime)
    price = Column(Float)
    
    # Additional metadata
    year = Column(Integer)
    month = Column(Integer)
    
    # Relationships
    task = relationship("Task", back_populates="sales_data")
    
    def to_dict(self):
        return {
            "id": self.id,
            "task_id": self.task_id,
            "source": self.source,
            "company": self.company,
            "car_model": self.car_model,
            "sale_date": self.sale_date.isoformat() if self.sale_date else None,
            "price": self.price,
            "year": self.year,
            "month": self.month
        }

