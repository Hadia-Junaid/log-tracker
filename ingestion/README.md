### Log Ingestion Agent:
This part of the logging microservice pulls logs from a Redis queue using a BullMQ Worker and stores them in MongoDB Atlas. 
It is meant to be deployed as an independent service. 

### To use the ingestion agent:
1) Configuration:
 - Configure the hostname and port of the Redis queue server by navigating to config folder and specifying the desired configuration in default.json. 
   For production or development specific configurations, you may modify production.json or development.json respectively.
 - Create a .env file specifying the following variables:
    - MONGO_URI - your MongoDB Atlas URI
    - REDIS_PASSWORD - the password to the Redis instance that you want to pull from
    
2) Run the following command:
    docker compose up --build