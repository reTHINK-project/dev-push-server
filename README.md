# dev-push-server
Node.js server which handles web push subscription/notifications. Subs are persisted in Mongo.

To run:
```
npm install
node server.js
```

Mongo must be up and running.


## server.js

Express app, with following listeners (POST):
- /subscribe: receive a new subscription and save it to the DB;
- /delete: delete every subscription from DB;
- /send: send a subscription.

## client.js

Registers a SW and creates a push subscription, which is sent to the server.

