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

# Weighted log levels (INFO x5, ERROR x3, DEBUG x2, WARN x1)
weighted_log_levels=(
  "INFO" "INFO" "INFO" "INFO" "INFO"
  "ERROR" "ERROR" "ERROR"
  "DEBUG" "DEBUG"
  "WARN"
)

while true; do
  for i in {1..1000}; do
    # Timestamp in ISO8601 format: yyyy-MM-dd HH:mm:ss,SSS
    timestamp=$(date -u +"%Y-%m-%d %H:%M:%S,%3N")

    # Random message and weighted log level
    msg=${messages[$RANDOM % ${#messages[@]}]}
    level=${weighted_log_levels[$RANDOM % ${#weighted_log_levels[@]}]}

    # Print log line
    echo "[$timestamp] [$level] [traceid=$traceid] $msg"
  done

  # Sleep 1 second before next batch
  sleep 1
done
