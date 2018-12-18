const express = require('express');
var cors = require('cors');
const webpush = require('web-push');
const mongoose = require('mongoose');

const publicVapidKey = 'BModNUsDflbBPzM7GGJelo4vh_wPzfCUpp7VHQAr8zeCuWkTeja4xk0XvWIj7KImXZ6iG6yqw_DfiJSJNvj7ofA';
const privateVapidKey = 'IDQK8cT5rqpCpvZet5p7z1kWAsuCkOOeeD30e1mB62Y';

// Replace with your email
webpush.setVapidDetails('mailto:rafaelfelgueiras1993@gmail.com', publicVapidKey, privateVapidKey);

const app = express();

app.use(cors());
app.use(require('body-parser').json());

// mongo
let mongoHosts = (process.env.MONGO_HOSTS) ? process.env.MONGO_HOSTS : 'mongodb://localhost/test';
mongoose.connect(mongoHosts);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  // we're connected!
  console.log('connected to Mongo');

});

// schemas
var subscriptionSchema = new mongoose.Schema({
  subscription: Object
});

var notificationSchema = new mongoose.Schema({
  notification: Object,
  date: Date
});

// schema -> model
var Subscription = mongoose.model(process.env.SUBSCRIPTION_COLLECTION, subscriptionSchema);
var Notification = mongoose.model(process.env.NOTIFICATION_COLLECTION, notificationSchema);


// listen for subscriptions
app.post('/subscribe', (req, res) => {

  const subscription = req.body;
  res.status(201).json({});

  Subscription.findOne({ subscription: subscription }, function (err, res) {
    if (err) return console.error(err);

    if (res == null) {
      // create document
      var sub = new Subscription({ subscription: subscription });
      // save
      sub.save(function (err, sub) {
        if (err) return console.error(err);
        console.log('saved');
      });
    }
  });



});

app.delete('/subscription', (req, res) => {
  const subscription = req.body;
  res.status(201).json({});
  Subscription.findOneAndDelete({ subscription: subscription }, function (err, res) {
    if (err) return console.error(err);

    console.log('deleted');

  });

});


app.delete('/notifications', (req, res) => {
  res.status(201).json({});
  Notification.deleteMany(function (err, res) {
    if (err) return console.error(err);
    console.log('deleted notifications');
  });

});

app.post('/notification', (req, res) => {
  const notification = req.body;
  res.status(201).json({});

  const payload = JSON.stringify(notification);
  console.log('Sending ', payload);

  // save notification
  const notificationMongo = new Notification({ notification: notification, date: new Date() });
  notificationMongo.save(function (err, sub) {
    if (err) return console.error(err);
    console.log('saved notification');
  });

  Subscription.find(function (err, subs) {
    if (err) return console.error(err);

    subs.forEach(sub => {
      // console.log('Sub: ', sub);
      webpush.sendNotification(sub.subscription, payload).catch(error => {
        console.error(error.stack);
      });

    });
  })
});

app.get('/notifications', (req, res) => {
  const lastDate = req.query.date;
  console.log('getting notifications after date: ', lastDate);

  Notification.find({ date: { "$gt": new Date(lastDate)} }, function (err, subs) {
    if (err) return console.error(err);
    res.status(201).json(subs);
  })
});

app.use(require('express-static')('./'));

let nodePort = (process.env.NODE_PORT) ? Number(process.env.NODE_PORT) : 3002;
console.log('Listing on ', nodePort);

app.listen(nodePort);
