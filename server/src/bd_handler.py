from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, Product
import logging

log = logging.getLogger(__name__)

class BD_handler():
    def __init__(self):
        super().__init__()
        self.running = True
    
    def run(self):
        log.info("bd_handler запущен.")
        
    def get_all_entity(self):
        engine = create_engine('sqlite:///../db/products.db')
        Session = sessionmaker(bind=engine)
        session = Session()
        return session.query(Product).all()
    
    def stop(self):
        self.running = False
