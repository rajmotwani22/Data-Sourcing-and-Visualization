from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker, Session
import os
import json
import csv
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime
import time

from models import Base, Task, SalesData, TaskStatus
from queue_manager import QueueManager

# Initialize FastAPI app
app = FastAPI(title="Data Visualization API", version="1.0.0")

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Set up database
DATABASE_URL = os.environ.get('DATABASE_URL', 'sqlite:///sales_data.db')
engine = create_engine(DATABASE_URL)
Base.metadata.create_all(engine)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic models for API
class TaskRequest(BaseModel):
    source_a: Dict[str, Any] = {}
    source_b: Dict[str, Any] = {}

class TaskResponse(BaseModel):
    id: int
    status: str
    created_at: str
    updated_at: str
    parameters: Dict[str, Any]

    class Config:
        orm_mode = True

class SalesDataResponse(BaseModel):
    id: int
    task_id: int
    source: str
    company: Optional[str]
    car_model: Optional[str]
    sale_date: Optional[str]
    price: Optional[float]
    year: Optional[int]
    month: Optional[int]

    class Config:
        orm_mode = True

# Initialize queue manager
queue_manager = QueueManager(SessionLocal)

@app.on_event("startup")
async def startup_event():
    # Start the queue manager
    queue_manager.start()
    
    # Create sample data directory if it doesn't exist
    data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
    os.makedirs(data_dir, exist_ok=True)
    
    # Create sample JSON data if it doesn't exist
    json_file = os.path.join(data_dir, 'sample_data_a.json')
    if not os.path.exists(json_file):
        sample_data = [
            {
                "company": "Toyota",
                "car_model": "Camry",
                "sale_date": "2023-01-15T12:30:00",
                "price": 28000
            },
            {
                "company": "Honda",
                "car_model": "Accord",
                "sale_date": "2023-02-10T14:45:00",
                "price": 27500
            },
            {
                "company": "Ford",
                "car_model": "Mustang",
                "sale_date": "2023-03-05T09:15:00",
                "price": 42000
            },
            {
                "company": "Toyota",
                "car_model": "Corolla",
                "sale_date": "2023-04-20T16:20:00",
                "price": 23000
            },
            {
                "company": "Honda",
                "car_model": "Civic",
                "sale_date": "2023-05-12T11:10:00",
                "price": 22500
            },
            {
                "company": "Toyota",
                "car_model": "RAV4",
                "sale_date": "2024-01-15T12:30:00",
                "price": 30000
            },
            {
                "company": "Honda",
                "car_model": "CR-V",
                "sale_date": "2024-02-10T14:45:00",
                "price": 29500
            },
            {
                "company": "Ford",
                "car_model": "Explorer",
                "sale_date": "2024-03-05T09:15:00",
                "price": 38000
            },
            {
                "company": "Toyota",
                "car_model": "Highlander",
                "sale_date": "2024-04-20T16:20:00",
                "price": 35000
            },
            {
                "company": "Honda",
                "car_model": "Pilot",
                "sale_date": "2024-05-12T11:10:00",
                "price": 36500
            }
        ]
        with open(json_file, 'w') as f:
            json.dump(sample_data, f, indent=2)
    
    # Create sample CSV data if it doesn't exist
    csv_file = os.path.join(data_dir, 'sample_data_b.csv')
    if not os.path.exists(csv_file):
        sample_data = [
            {
                "company": "Toyota",
                "car_model": "Camry",
                "sale_date": "2023-01-20",
                "price": 29000
            },
            {
                "company": "Honda",
                "car_model": "Accord",
                "sale_date": "2023-02-15",
                "price": 28500
            },
            {
                "company": "Chevrolet",
                "car_model": "Malibu",
                "sale_date": "2023-03-10",
                "price": 25000
            },
            {
                "company": "Toyota",
                "car_model": "Corolla",
                "sale_date": "2023-04-25",
                "price": 24000
            },
            {
                "company": "Honda",
                "car_model": "Civic",
                "sale_date": "2023-05-18",
                "price": 23500
            },
            {
                "company": "Toyota",
                "car_model": "RAV4",
                "sale_date": "2024-01-20",
                "price": 31000
            },
            {
                "company": "Honda",
                "car_model": "CR-V",
                "sale_date": "2024-02-15",
                "price": 30500
            },
            {
                "company": "Chevrolet",
                "car_model": "Equinox",
                "sale_date": "2024-03-10",
                "price": 27000
            },
            {
                "company": "Toyota",
                "car_model": "Highlander",
                "sale_date": "2024-04-25",
                "price": 36000
            },
            {
                "company": "Honda",
                "car_model": "Pilot",
                "sale_date": "2024-05-18",
                "price": 37500
            }
        ]
        with open(csv_file, 'w', newline='') as f:
            fieldnames = ["company", "car_model", "sale_date", "price"]
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(sample_data)

@app.on_event("shutdown")
async def shutdown_event():
    # Stop the queue manager
    queue_manager.stop()

@app.get("/api/tasks", response_model=List[TaskResponse])
async def get_tasks(db: Session = Depends(get_db)):
    """Get all tasks"""
    tasks = db.query(Task).order_by(Task.created_at.desc()).all()
    return [TaskResponse(
        id=task.id,
        status=task.status.value,
        created_at=task.created_at.isoformat(),
        updated_at=task.updated_at.isoformat(),
        parameters=task.parameters
    ) for task in tasks]

@app.post("/api/tasks", response_model=TaskResponse, status_code=201)
async def create_task(
    task_data: TaskRequest, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Create a new task"""
    parameters = {"source_a": task_data.source_a, "source_b": task_data.source_b}
    task = Task(parameters=parameters)
    db.add(task)
    db.commit()
    db.refresh(task)
    
    # Add task to queue as a background task
    background_tasks.add_task(queue_manager.add_task, task.id)
    
    return TaskResponse(
        id=task.id,
        status=task.status.value,
        created_at=task.created_at.isoformat(),
        updated_at=task.updated_at.isoformat(),
        parameters=task.parameters
    )

@app.get("/api/tasks/{task_id}", response_model=TaskResponse)
async def get_task(task_id: int, db: Session = Depends(get_db)):
    """Get a specific task"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    return TaskResponse(
        id=task.id,
        status=task.status.value,
        created_at=task.created_at.isoformat(),
        updated_at=task.updated_at.isoformat(),
        parameters=task.parameters
    )

@app.get("/api/tasks/{task_id}/data", response_model=List[SalesDataResponse])
async def get_task_data(task_id: int, db: Session = Depends(get_db)):
    """Get data for a specific task"""
    # Check if task exists and is completed
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    if task.status != TaskStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Task not completed yet")
        
    # Get data associated with the task
    data = db.query(SalesData).filter(SalesData.task_id == task_id).all()
    
    return [SalesDataResponse(
        id=item.id,
        task_id=item.task_id,
        source=item.source,
        company=item.company,
        car_model=item.car_model,
        sale_date=item.sale_date.isoformat() if item.sale_date else None,
        price=item.price,
        year=item.year,
        month=item.month
    ) for item in data]

@app.get("/api/tasks/{task_id}/summary")
async def get_task_summary(task_id: int, db: Session = Depends(get_db)):
    """Get summary statistics for a task"""
    # Check if task exists and is completed
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    if task.status != TaskStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Task not completed yet")
        
    # Sales by company
    sales_by_company = db.query(
        SalesData.company,
        func.count(SalesData.id).label('count'),
        func.sum(SalesData.price).label('total_sales')
    ).filter(
        SalesData.task_id == task_id
    ).group_by(
        SalesData.company
    ).all()
    
    # Sales by year and month
    sales_by_time = db.query(
        SalesData.year,
        SalesData.month,
        func.count(SalesData.id).label('count'),
        func.sum(SalesData.price).label('total_sales')
    ).filter(
        SalesData.task_id == task_id
    ).group_by(
        SalesData.year,
        SalesData.month
    ).all()
    
    # Sales by source
    sales_by_source = db.query(
        SalesData.source,
        func.count(SalesData.id).label('count'),
        func.sum(SalesData.price).label('total_sales')
    ).filter(
        SalesData.task_id == task_id
    ).group_by(
        SalesData.source
    ).all()
    
    # Sales by car model
    sales_by_model = db.query(
        SalesData.car_model,
        func.count(SalesData.id).label('count'),
        func.sum(SalesData.price).label('total_sales')
    ).filter(
        SalesData.task_id == task_id
    ).group_by(
        SalesData.car_model
    ).all()
    
    return {
        "sales_by_company": [
            {"company": company, "count": count, "total_sales": float(total_sales)}
            for company, count, total_sales in sales_by_company
        ],
        "sales_by_time": [
            {"year": year, "month": month, "count": count, "total_sales": float(total_sales)}
            for year, month, count, total_sales in sales_by_time
        ],
        "sales_by_source": [
            {"source": source, "count": count, "total_sales": float(total_sales)}
            for source, count, total_sales in sales_by_source
        ],
        "sales_by_model": [
            {"model": model, "count": count, "total_sales": float(total_sales)}
            for model, count, total_sales in sales_by_model
        ]
    }

@app.get("/api/companies", response_model=List[str])
async def get_companies(db: Session = Depends(get_db)):
    """Get list of all car companies in the data"""
    companies = db.query(SalesData.company).distinct().all()
    return [company[0] for company in companies if company[0]]

@app.get("/api/models", response_model=List[str])
async def get_models(db: Session = Depends(get_db)):
    """Get list of all car models in the data"""
    models = db.query(SalesData.car_model).distinct().all()
    return [model[0] for model in models if model[0]]

if __name__ == '__main__':
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)