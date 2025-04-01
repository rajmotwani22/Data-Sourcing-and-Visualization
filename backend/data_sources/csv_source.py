import csv
import os
import logging
from datetime import datetime
from models import SalesData

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CSVDataSource:
    def __init__(self, file_path=None):
        self.file_path = file_path or os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 
                                                 'data', 'sample_data_b.csv')
        
    def get_data(self, filters=None):
        """
        Fetch data from CSV source with applied filters
        
        Args:
            filters (dict): Filters to apply to the data
                - start_date (str): Start date in ISO format
                - end_date (str): End date in ISO format
                - companies (list): List of companies to include
                - models (list): List of car models to include
                
        Returns:
            list: Filtered data records
        """
        if filters is None:
            filters = {}
            
        try:
            data = []
            with open(self.file_path, 'r', newline='', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                data = list(reader)
                
            # Apply filters
            filtered_data = self._apply_filters(data, filters)
            
            logger.info(f"Retrieved {len(filtered_data)} records from CSV source")
            return filtered_data
            
        except Exception as e:
            logger.error(f"Error retrieving data from CSV source: {str(e)}")
            return []
            
    def _apply_filters(self, data, filters):
        filtered_data = []
        
        start_date = filters.get('start_date')
        end_date = filters.get('end_date')
        companies = filters.get('companies', [])
        models = filters.get('models', [])
        
        start_date = datetime.fromisoformat(start_date) if start_date else None
        end_date = datetime.fromisoformat(end_date) if end_date else None
        
        for record in data:
            # Parse sale date
            sale_date = None
            if 'sale_date' in record:
                try:
                    sale_date = datetime.fromisoformat(record['sale_date'])
                except (ValueError, TypeError):
                    try:
                        # Try different date formats
                        sale_date = datetime.strptime(record['sale_date'], '%Y-%m-%d')
                    except (ValueError, TypeError):
                        continue
            
            # Apply date filters
            if start_date and (not sale_date or sale_date < start_date):
                continue
                
            if end_date and (not sale_date or sale_date > end_date):
                continue
                
            # Apply company filter
            if companies and record.get('company') not in companies:
                continue
                
            # Apply model filter
            if models and record.get('car_model') not in models:
                continue
                
            filtered_data.append(record)
            
        return filtered_data
        
    def save_data(self, session, task_id, data):
        """
        Save data to the database
        
        Args:
            session: SQLAlchemy session
            task_id (int): Task ID
            data (list): Data records to save
        """
        for record in data:
            try:
                sale_date = None
                if 'sale_date' in record:
                    try:
                        sale_date = datetime.fromisoformat(record['sale_date'])
                    except (ValueError, TypeError):
                        try:
                            # Try different date formats
                            sale_date = datetime.strptime(record['sale_date'], '%Y-%m-%d')
                        except (ValueError, TypeError):
                            sale_date = None
                
                sales_data = SalesData(
                    task_id=task_id,
                    source='source_b',
                    company=record.get('company'),
                    car_model=record.get('car_model'),
                    sale_date=sale_date,
                    price=float(record.get('price', 0)),
                    year=sale_date.year if sale_date else None,
                    month=sale_date.month if sale_date else None
                )
                
                session.add(sales_data)
            except Exception as e:
                logger.error(f"Error saving record to database: {str(e)}")
                
        session.commit()
        logger.info(f"Saved {len(data)} records from CSV source to database")