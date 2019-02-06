const mongoose = require('mongoose');

// schemas
var subscriptionSchema = new mongoose.Schema({
    subscription: Object
});

mongoose.model(process.env.SUBSCRIPTION_COLLECTION, subscriptionSchema);