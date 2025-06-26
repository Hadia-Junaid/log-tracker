### To Run the Fluentbit System
docker run -it --rm   -v "$(pwd)/fluent-bit.conf:/fluent-bit/etc/fluent-bit.conf"   -v "$(pwd)/logs:/fluent-bit/logs"   majst01/fluent-bit-go-redis-output