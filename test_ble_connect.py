# test_serial.py
import serial
import time

PORT = "COM3"  # ← твой порт
ser = serial.Serial(PORT, 115200, timeout=2)
time.sleep(2)

ser.write(b"get\n")
ser.flush()
response = ser.readline()
print(f"Ответ от весов: {response.decode().strip()}")
ser.close()