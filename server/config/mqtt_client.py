import serial
import threading
import time
import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)

# Настройки по умолчанию (можно переопределить через .env)
SERIAL_PORT = os.getenv("SCALES_SERIAL_PORT", "COM3" if os.name == "nt" else "/dev/ttyUSB0")
SERIAL_BAUDRATE = int(os.getenv("SCALES_SERIAL_BAUDRATE", "115200"))
SERIAL_TIMEOUT = float(os.getenv("SCALES_SERIAL_TIMEOUT", "5.0"))
REQUEST_TIMEOUT = float(os.getenv("SCALES_REQUEST_TIMEOUT", "5.0"))


class ScalesService:
    def __init__(
        self,
        port: str = SERIAL_PORT,
        baudrate: int = SERIAL_BAUDRATE,
        timeout: float = SERIAL_TIMEOUT,
    ):
        self._port = port
        self._baudrate = baudrate
        self._timeout = timeout
        self._lock = threading.Lock()
        self._ser: Optional[serial.Serial] = None
        self._thread: Optional[threading.Thread] = None
        self._running = False
        self._latest_weight: Optional[float] = None
        self._ready = threading.Event()

    def start(self):
        """Запускает фоновый поток для работы с последовательным портом."""
        if self._thread and self._thread.is_alive():
            logger.warning("ScalesService уже запущен")
            return

        self._running = True
        self._thread = threading.Thread(
            target=self._run_serial_loop, daemon=True, name="scales-serial-worker"
        )
        self._thread.start()

        # Ждём успешного открытия порта
        if not self._ready.wait(timeout=10.0):
            raise RuntimeError(f"Не удалось открыть порт {self._port} за 10 сек.")
        logger.info(f"Serial подключён: {self._port} @ {self._baudrate}")

    def _run_serial_loop(self):
        """Фоновый цикл: открываем порт и ждём запросов."""
        try:
            # Открываем порт с флагами для надёжности
            self._ser = serial.Serial(
                port=self._port,
                baudrate=self._baudrate,
                timeout=self._timeout,
                write_timeout=self._timeout,
                exclusive=True,  # Блокируем доступ другим процессам
            )
            time.sleep(2)  # Даём весам время на инициализацию после подключения
            self._ser.reset_input_buffer()
            self._ser.reset_output_buffer()
            self._ready.set()

            # Основной цикл: порт открыт, ждём запросов через get_weight()
            while self._running:
                time.sleep(0.1)  # Минимальная загрузка CPU

        except serial.SerialException as e:
            logger.error(f"❌ Ошибка открытия порта {self._port}: {e}")
            self._ready.clear()
        finally:
            self._cleanup_serial()

    def _cleanup_serial(self):
        """Корректно закрывает порт."""
        if self._ser and self._ser.is_open:
            try:
                self._ser.reset_input_buffer()
                self._ser.reset_output_buffer()
                self._ser.close()
            except Exception as e:
                logger.warning(f"Предупреждение при закрытии порта: {e}")
            finally:
                self._ser = None

    def _send_command(self, command: str) -> Optional[float]:
        """Отправляет команду и читает ответ. Вызывается ТОЛЬКО с захваченным _lock."""
        if not self._ser or not self._ser.is_open:
            raise ConnectionError("Порт не открыт")

        # Формируем команду с \n (как в прошивке ESP32)
        cmd = f"{command}\n".encode()
        self._ser.write(cmd)
        self._ser.flush()

        # Читаем ответ до \n
        response = self._ser.readline()
        if not response:
            raise TimeoutError("Нет ответа от весов")

        # Парсим число
        try:
            return float(response.decode().strip())
        except ValueError as e:
            logger.warning(f"Некорректный ответ от весов: {response!r}")
            raise ValueError(f"Не удалось распарсить вес: {response!r}") from e

    def get_weight(self) -> float:
        """
        Синхронный метод для вызова из FastAPI-роутов.
        Отправляет 'get' и возвращает вес в граммах.
        """
        if not self._ready.is_set():
            raise RuntimeError("ScalesService не запущен или порт не открыт")

        with self._lock:
            try:
                weight = self._send_command("get")
                self._latest_weight = weight
                logger.debug(f"Вес получен: {weight} г")
                return weight
            except (serial.SerialException, ConnectionError) as e:
                logger.error(f"Ошибка связи с весами: {e}")
                raise ConnectionError("Не удалось связаться с весами. Проверьте кабель и порт.") from e
            except TimeoutError as e:
                logger.warning("Таймаут при опросе весов")
                raise TimeoutError("Весы не ответили за 5 сек.") from e
            except Exception as e:
                logger.error(f"Неожиданная ошибка: {e}")
                raise RuntimeError(f"Внутренняя ошибка при чтении веса: {e}") from e

    def stop(self):
        """Останавливает фоновый поток и закрывает порт."""
        self._running = False
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=5.0)
        self._cleanup_serial()
        logger.info("ScalesService остановлен")

    def __del__(self):
        """Гарантируем закрытие порта при удалении объекта."""
        self.stop()