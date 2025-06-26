### To Run the Fluentbit System
1) Go to fluent-bit.conf file and update the IP address and port that hosts your redis server.
2) Run the following command:
    docker run -it --rm   -v "$(pwd)/fluent-bit.conf:/fluent-bit/etc/fluent-bit.conf"   -v "$(pwd)/logs:/fluent-bit/logs"   majst01/fluent-bit-go-redis-output