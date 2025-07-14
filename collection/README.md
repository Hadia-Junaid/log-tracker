### To Run the Fluentbit System
1) Go to fluent-bit.conf file and update the IP address and port that hosts your redis server.
2) Any logs generated should be stored in the logs folder with the .log extension.
3) (Optional) You may use the mock application scripts:
    cd mock-application-scripts
    -> databse
        cd database:
        python3 write_logs.py
        python3 polling.py
    -> file
        cd file
        npm i
        node generateLogs.js
    -> I/O stream
        ./console.sh
4) Store the following variables in a .env file:
    REDIS_HOST
    REDIS_PORT
    REDIS_PASSWORD
    APPLICATION_ID

4) Run the following command to create fluent-bit.conf file:
    ./generate-conf.sh
    
5) Run the following command to run fluentbit:
    docker run -it --rm   -v "$(pwd)/fluent-bit.conf:/fluent-bit/etc/fluent-bit.conf"   -v "$(pwd)/logs:/fluent-bit/logs"   majst01/fluent-bit-go-redis-output