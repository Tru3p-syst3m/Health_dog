from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, Product
import threading
import logging
import queue

log = logging.getLogger(__name__)

class BD_handler(threading.Thread):
    def __init__(self, bd_queue):
        super().__init__()
        self.bd_queue = bd_queue
        self.running = True
    
    def run(self):
        log.info("Поток обработки bd_handler запущен.")
        engine = create_engine('sqlite:///../db/products.db')
        Session = sessionmaker(bind=engine)
        
        while self.running:
            try:
                command = self.bd_queue.get(timeout=0.1)
                if(command == 'print'):
                    session = Session()
                    all_products = session.query(Product).all()
                    print("Все продукты:", all_products)
                    continue
                last_space = command.rfind(' ')
                if last_space == -1:
                    raise ValueError("Неверная команда")
                name = command[:last_space].strip()
                waight_to_add = float(command[last_space:].strip())
                session = Session()
                product = session.query(Product).filter(Product.name == name).first()
                product.weight_grams += waight_to_add
                session.commit()
                session.close()
            except queue.Empty:
                pass
            except ValueError as e:
                log.error(f"Ошибка формата команды {e}")
    def stop(self):
        self.running = False
