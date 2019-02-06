const mongoose = require('mongoose');

var notificationSchema = new mongoose.Schema({
    notification: Object,
    date: Date
});

// schema -> model
const Notification = mongoose.model(process.env.NOTIFICATION_COLLECTION, notificationSchema);