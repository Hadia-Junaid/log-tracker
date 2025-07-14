#!/bin/bash
exec > >(tee -a ../../logs/io_logs.log) 2>&1

traceid="abcd1234"

# Sample log messages
messages=(
  "User logged in"
  "File uploaded successfully"
  "Connection timeout"
  "Disk space running low"
  "Scheduled job executed"
  "Database query failed"
  "Cache cleared"
  "Service restarted"
  "Configuration updated"
  "Unexpected error occurred"
)

# Available log levels
log_levels=("INFO" "ERROR" "WARN" "DEBUG")

while true; do
  for i in {1..10}; do
    # Timestamp in ISO8601 format: yyyy-MM-dd HH:mm:ss,SSS
    timestamp=$(date -u +"%Y-%m-%d %H:%M:%S,%3N")

    # Random message and log level
    msg=${messages[$RANDOM % ${#messages[@]}]}
    level=${log_levels[$RANDOM % ${#log_levels[@]}]}

    # Print log line matching the format: [%d] [%p] [%X{traceid}]%m%n
    echo "[$timestamp] [$level] [traceid=$traceid] $msg"
  done

  # Sleep 1 second before generating the next 1000 logs
  sleep 1
done
