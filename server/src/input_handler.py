import sys
import threading
import logging

log = logging.getLogger(__name__)

class Input_handler(threading.Thread):
    def __init__(self, command_queue):
        super().__init__()
        self.command_queue = command_queue
        self.daemon = True
        self.running = True
    
    def run(self):
        log.info("Поток обработки input_handler запущен.")
        while self.running:
            try:
                command = sys.stdin.readline().strip()
                if command:
                    if command.lower() == 'quit':
                        self.command_queue.put("QUIT")
                        break
                    else:
                        self.command_queue.put(command)
                        
            except Exception as e:
                log.error(f"Ошибка {e}")
    
    def stop(self):
        self.running = False
