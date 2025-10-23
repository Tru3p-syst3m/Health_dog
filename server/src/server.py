
from mqtt_client import MQTTClient
from bd_handler import BD_handler
from input_handler import Input_handler
import queue
import time
import logging

logging.basicConfig(
    level=logging.INFO,
    format='[%(name)s] %(levelname)s: %(message)s',
    force=True
)

log = logging.getLogger(__name__)

def main():
    
    command_queue = queue.Queue()
    bd_queue = queue.Queue()
    
    stdin_processor = Input_handler(command_queue)
    bd_handler = BD_handler(bd_queue)
    stdin_processor.start()
    bd_handler.start()
    
    client = MQTTClient()
    client.start()

    log.info("Основной поток запущен. Ожидаю команды...")
    
    try:
        while True:
            try:
                command = command_queue.get(timeout=0.1)
                
                if command == "print":
                    bd_queue.put(command)
                    continue
                elif command == "QUIT":
                    log.info("Получена команда выхода")
                    break
                
                client.publish("get")
                weight_value = client.wait_for_value(timeout=10)
                bd_command = command + " " + str(weight_value)
                bd_queue.put(bd_command)
                
            except queue.Empty:
                pass
                
    except KeyboardInterrupt:
        log.info("\nПрервано пользователем")
    finally:
        client.stop()
        stdin_processor.stop()
        bd_handler.stop()
        stdin_processor.join()
        bd_handler.join()
        log.info("Программа завершена")

if __name__ == "__main__":
    main()