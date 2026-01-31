# StatusService
Personal system for friends status tracking. Helps to track who is ready to play some game.

# Mongo db
docker run -d --name status-api-mongodb -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=localDb123 mongodb/mongodb-community-server
connectionString: mongodb://admin:localDb123@localhost:27017