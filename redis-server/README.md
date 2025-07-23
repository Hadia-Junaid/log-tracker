### To Run the Redis Server

1. Create a .env file with the following contents:

    REDIS_HOST
    REDIS_PORT
    REDIS_PASSWORD

2. Then run:

    docker compose up --build

- This will start up the bridge script as well as the redis server.

- Note: you can simply run the redis-server as part of the whole application by navigating to the project root directory and running:
    docker compose up --build

