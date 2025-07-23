import time
import psycopg2
from datetime import datetime
from dotenv import load_dotenv
import os
import random

load_dotenv()

conn = psycopg2.connect(
    host=os.getenv("PG_HOST"),
    port=os.getenv("PG_PORT"),
    dbname=os.getenv("PG_DB"),
    user=os.getenv("PG_USER"),
    password=os.getenv("PG_PASSWORD")
)

messages = [
    "User logged in",
    "File uploaded successfully",
    "Connection timeout",
    "Disk space running low",
    "Scheduled job executed",
    "Database query failed",
    "Cache cleared",
    "Service restarted",
    "Configuration updated",
    "Unexpected error occurred"
]

log_levels = ["info", "error", "warn", "debug"]

def insert_logs(batch_size=1000):
    with conn.cursor() as cur:
        for _ in range(batch_size):
            message = random.choice(messages)
            level = random.choice(log_levels)
            timestamp = datetime.utcnow()
            cur.execute(
                "INSERT INTO log (level, message, timestamp) VALUES (%s, %s, %s)",
                (level, message, timestamp)
            )
    conn.commit()

try:
    while True:
        start_time = time.time()
        insert_logs()
        elapsed = time.time() - start_time
        time.sleep(max(0, 1.0 - elapsed))
        print("Inserted 1000 logs.")
except KeyboardInterrupt:
    print("Stopped.")
finally:
    conn.close()
