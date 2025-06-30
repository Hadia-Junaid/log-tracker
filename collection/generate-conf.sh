#!/bin/bash
# Load .env variables into the environment
set -o allexport
source .env
set +o allexport

# Generate fluent-bit.conf from the template
envsubst < fluentbit.template.conf > fluent-bit.conf
