import logging
from mqtt_client import MQTTClient
from bd_handler import BD_handler

log = logging.getLogger(__name__)

mqtt_client = None
bd_handler = None
command_queue = None

def init_components():
    global mqtt_client, bd_handler, command_queue

    try:
        mqtt_client = MQTTClient()
        mqtt_client.start()
        log.info("MQTT клиент инициализирован")
    except Exception as e:
        log.error(f"Ошибка инициализации MQTT: {e}")
        mqtt_client = None
    
    try:
        bd_handler = BD_handler()
        bd_handler.run()
        log.info("Обработчик БД инициализирован")
    except Exception as e:
        log.error(f"Ошибка инициализации БД: {e}")
        bd_handler = None

def cleanup_components():
    global mqtt_client, bd_handler
    
    log.info("Остановка компонентов...")
    
    if mqtt_client:
        mqtt_client.stop()
        log.info("MQTT клиент остановлен")
    
    if bd_handler:
        bd_handler.stop()
        log.info("Обработчик БД остановлен")

def get_mqtt_client():
    return mqtt_client

def get_bd_handler():
    return bd_handler
