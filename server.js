const express = require('express');
var cors = require('cors');
const webpush = require('web-push');
const mongoose = require('mongoose');
const auth = require('./auth.js');
// models
require('./models/Subscription');
require('./models/Notification');
require('./models/User');
require('./config/passport');
const { publicVapidKey, privateVapidKey } = require('./config/vapid');


const Subscription = mongoose.model('subscription');
const Notification = mongoose.model('notification');
const User = mongoose.model('User');

//passport 
const passport = require("passport");

// Replace with your email
webpush.setVapidDetails('mailto:rafaelfelgueiras1993@gmail.com', publicVapidKey, privateVapidKey);

const app = express();
app.use(cors());
app.use(require('body-parser').json());
app.use(passport.initialize());
app.use(passport.session());

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

app.delete('/subscription',
  passport.authenticate('local'),
  (req, res) => {
    const subscription = req.body;
    res.status(201).json({});
    deleteSubscription(subscription);
  });


app.delete('/notifications',
  auth.required,
  (req, res) => {
    res.status(201).json({});


    Notification.deleteMany(function (err, res) {
      if (err) return console.error(err);
      console.log('deleted notifications');
    });

  });



app.post('/notification',
  auth.required,
  (req, res) => {
    const notification = req.body;
    res.status(201).json({});

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

//POST login route (optional, everyone has access)
app.post('/login',
  auth.optional,
  (req, res, next) => {
    const { body: { user } } = req;


    if (!user.email) {
      return res.status(422).json({
        errors: {
          email: 'is required',
        },
      });
    }

    if (!user.password) {
      return res.status(422).json({
        errors: {
          password: 'is required',
        },
      });
    }

    return passport.authenticate('local', { session: false }, (err, passportUser, info) => {

      if (err) {
        return next(err);
      }

      if (passportUser) {
        const user = passportUser;
        user.token = passportUser.generateJWT();

        return res.json({ user: user.toAuthJSON() });
      }

      return res.status(400).json(info);
    })(req, res, next);
  });

app.use(require('express-static')('./'));

let nodePort = (process.env.NODE_PORT) ? Number(process.env.NODE_PORT) : 3002;
console.log('Listening on ', nodePort);

app.listen(nodePort);

const singleUser = {
  email: "admin",
  password: "admin"
}

User.findOne({ email: singleUser.email })
  .then((user) => {

    const finalUser = new User(singleUser);

    if (user)
      return;

    finalUser.setPassword(singleUser.password);
    finalUser.save().then(res => {
      console.log('added user');
    })
  }).catch();
