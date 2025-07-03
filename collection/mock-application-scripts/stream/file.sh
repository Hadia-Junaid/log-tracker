#!/bin/bash

LOG_FILE="../../logs/app.log"

echo "Starting file log simulation... (1 log/second)"
counter=1

while true
do
  timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  echo "FILE [$timestamp] INFO Request received - ID $counter" >> "$LOG_FILE"
  ((counter++))
  sleep 1
done
