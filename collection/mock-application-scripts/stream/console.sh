#!/bin/bash
exec > >(tee -a ../../logs/io_logs.log) 2>&1

counter=0
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

while true
do
  timestamp=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")  # UTC ISO timestamp
  msg=${messages[$RANDOM % ${#messages[@]}]}
  echo "[$timestamp] [INFO] [$traceid]id=$counter message=\"${msg}\""
  ((counter++))
  sleep 5
done
