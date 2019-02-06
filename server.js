const express = require('express');
var cors = require('cors');
const webpush = require('web-push');
const mongoose = require('mongoose');
// models
require('./models/Subscription');
require('./models/Notification');
require('./models/User');

const Subscription = mongoose.model('subscription');
const Notification = mongoose.model('notification');
const User = mongoose.model('User');

//passport 
const passport = require("passport");
const LocalStrategy = require('passport-local').Strategy;
passport.use(new LocalStrategy(
  function (username, password, done) {
    console.log('Searching for ', username, password);

    User.findOne({ username: username }, function (err, user) {
      console.log(err, user);

      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (!user.validPassword(password)) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });
  }
));

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

function deleteSubscription(subscription) {

  Subscription.findOneAndDelete({ subscription: subscription }, function (err, res) {
    if (err) return console.error(err);

    console.log('deleted ', subscription);

  });

}

app.delete('/subscription', (req, res) => {
  const subscription = req.body;
  res.status(201).json({});
  deleteSubscription(subscription);
});


app.delete('/notifications', (req, res) => {
  res.status(201).json({});

  // TODO: security


  Notification.deleteMany(function (err, res) {
    if (err) return console.error(err);
    console.log('deleted notifications');
  });

});



app.post('/notification',
  //  passport.authenticate('local'),
  (req, res) => {
    const notification = req.body;
    res.status(201).json({});

    // TODO: security

    const payload = JSON.stringify(notification);

    // save notification
    const notificationMongo = new Notification({ notification: notification, date: new Date() });
    notificationMongo.save(function (err, sub) {
      if (err) return console.error(err);
      console.log('saved notification');
    });

    Subscription.find(function (err, subs) {
      if (err) return console.error(err);
      console.log(`Sending ${payload} to ${subs.length} subscribers`);

      subs.forEach(sub => {
        const { subscription } = sub;
        webpush.sendNotification(subscription, payload)
          .catch((err) => {
            if (err.statusCode === 410) {
              // the subscription has expired or is no longer valid. In these scenarios we remove the subscriptions the DB
              deleteSubscription(subscription);
            } else {
              console.log('Subscription is no longer valid: ', err);
              deleteSubscription(subscription)
            }
          });

      });
    })
  });

app.get('/notifications', (req, res) => {
  const lastDate = req.query.date;
  console.log('getting notifications after date: ', lastDate);

  Notification.find({ date: { "$gt": new Date(lastDate) } }, function (err, subs) {
    if (err) return console.error(err);
    res.status(201).json(subs);
  })
});

app.get('/subscriptions', (req, res) => {
  console.log('getting subscriptions');

  Subscription.find({}, function (err, subs) {
    if (err) return console.error(err);
    res.status(201).json(subs);
  })
});

app.use(require('express-static')('./'));

let nodePort = (process.env.NODE_PORT) ? Number(process.env.NODE_PORT) : 3002;
console.log('Listing on ', nodePort);

app.listen(nodePort);
