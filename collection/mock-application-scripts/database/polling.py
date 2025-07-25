import psycopg2
import time
import os
from dotenv import load_dotenv
from datetime import timezone

load_dotenv()

LOG_FILE = os.path.join(os.path.dirname(__file__), '..', '..', 'logs', 'app.log')
STATE_FILE = "last_timestamp.state"
POLL_INTERVAL = 2  # seconds

def get_last_timestamp():
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE) as f:
            return f.read().strip()
    else:
        return "1970-01-01T00:00:00Z"

def save_last_timestamp(timestamp):
    with open(STATE_FILE, "w") as f:
        f.write(timestamp)

def fetch_new_logs(conn, since_timestamp):
    with conn.cursor() as cur:
        cur.execute("""
            SELECT id, level, message, timestamp
            FROM log
            WHERE timestamp > %s
            ORDER BY timestamp ASC
        """, (since_timestamp,))
        return cur.fetchall()

def format_log(row):
    log_id, level, message, timestamp = row
    # Format: YYYY-MM-DD HH:mm:ss,SSS
    ts_str = timestamp.astimezone(timezone.utc).strftime('%Y-%m-%d %H:%M:%S,%f')[:-3]
    traceid = "abcd1234"
    return f"[{ts_str}] [{level.upper()}] [traceid={traceid}] {message}"

def main():
    conn = psycopg2.connect(
        host=os.getenv("PG_HOST"),
        port=os.getenv("PG_PORT"),
        dbname=os.getenv("PG_DB"),
        user=os.getenv("PG_USER"),
        password=os.getenv("PG_PASSWORD")
    )
    last_timestamp = get_last_timestamp()

    try:
        while True:
            logs = fetch_new_logs(conn, last_timestamp)
            if logs:
                with open(LOG_FILE, "a") as f:
                    for row in logs:
                        f.write(format_log(row) + "\n")
                        last_timestamp = row[3].isoformat()
                save_last_timestamp(last_timestamp)
            time.sleep(POLL_INTERVAL)
    except KeyboardInterrupt:
        print("Polling stopped.")
    finally:
        conn.close()

if __name__ == "__main__":
    main()
