#!/bin/bash
exec > >(tee -a ../logs/io_logs.log) 2>&1

echo "Starting terminal log simulation... (1 log/second)"
counter=1

while true
do
  timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  echo "TERMINAL [$timestamp] INFO Request received - ID $counter"
  ((counter++))
  sleep 1
done
