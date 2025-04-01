import threading
import time
import queue
import logging
from sqlalchemy.orm import Session
from models import Task, TaskStatus, SalesData
from data_sources.json_source import JSONDataSource
from data_sources.csv_source import CSVDataSource
from datetime import datetime

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class QueueManager:
    def __init__(self, db_session_factory):
        self.queue = queue.Queue()
        self.db_session_factory = db_session_factory
        self.worker_thread = None
        self.running = False
        
    def start(self):
        if self.running:
            return
            
        self.running = True
        self.worker_thread = threading.Thread(target=self._process_queue)
        self.worker_thread.daemon = True
        self.worker_thread.start()
        logger.info("Queue manager started")
        
    def stop(self):
        self.running = False
        if self.worker_thread:
            self.worker_thread.join(timeout=5)
        logger.info("Queue manager stopped")
        
    def add_task(self, task_id):
        self.queue.put(task_id)
        logger.info(f"Task {task_id} added to queue")
        
    def _process_queue(self):
        while self.running:
            try:
                task_id = self.queue.get(block=True, timeout=1)
                self._process_task(task_id)
                self.queue.task_done()
            except queue.Empty:
                continue
            except Exception as e:
                logger.error(f"Error processing queue: {str(e)}")
                
    def _process_task(self, task_id):
        logger.info(f"Processing task {task_id}")
        
        db = self.db_session_factory()
        try:
            # Get task from database
            task = db.query(Task).filter(Task.id == task_id).first()
            if not task:
                logger.error(f"Task {task_id} not found")
                return
            
            # Update status to IN_PROGRESS
            task.status = TaskStatus.IN_PROGRESS
            db.commit()
            
            # Simulate delay for task processing
            time.sleep(5)
            
            # Process data from source A (JSON)
            json_source = JSONDataSource()
            source_a_data = json_source.get_data(task.parameters.get('source_a', {}))
            
            # Process data from source B (CSV)
            csv_source = CSVDataSource()
            source_b_data = csv_source.get_data(task.parameters.get('source_b', {}))
            
            # Save data to database
            json_source.save_data(db, task.id, source_a_data)
            csv_source.save_data(db, task.id, source_b_data)
            
            # Simulate another delay
            time.sleep(5)
            
            # Update status to COMPLETED
            task.status = TaskStatus.COMPLETED
            db.commit()
            
            logger.info(f"Task {task_id} completed")
            
        except Exception as e:
            logger.error(f"Error processing task {task_id}: {str(e)}")
            task.status = TaskStatus.FAILED
            db.commit()
        finally:
            db.close()