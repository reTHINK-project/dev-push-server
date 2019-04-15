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


const Notification = mongoose.model(process.env.NOTIFICATION_COLLECTION);
const Subscription = mongoose.model(process.env.SUBSCRIPTION_COLLECTION);
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
mongoose.connect(mongoHosts, { useNewUrlParser: true });

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
  salt: 'a7680b28ea868691eb17d671d911a704',
  hash: '40afafac85fe8c07e8d954dfc9a740576db22cdaf91d964b4daeaa1bc469b6b97297a2fa4d539b3328956cb30968f0e368fc6f827b6c59a7565f5b01e07843f869112ddbb67819c2325d98908722cda747cf157e2408e4094554b65a0c270487fbacb80ae0a3b22a3dad99297de240c44bbe783d9bac48278ed3ca51e51c232fbfc4ab99860cf99d2321f62608d65ab3d4d504a1f79eab1d6f62d34eb5268374fd446dd163d222f6c40dcd110c2007f4e6f8ee589a7936292382408bd59ef27ccef5f8ec9d2c7f5d17e553126ef0c08ed55e4311728618d76edfd5ec80231fb9f93eb2f7bdcaef5d00b6cc4e1bb130d89ad5550f48d05008efa219ad1b99a041d7a222f6d84aab33b642070deb25d51df98c241f98388f22575dff74a2879ecb54ba208501c9417ec11f27d6aeebb50bbd497f853f8d0cd55ff14ae36e3957c2c09847dcd35a4a751c2fe21ff423b2b10724a1090f25082c8a164e2d40003c2a0b319410691c58b40219befac914e5431397a25d2b7470b548c440d93e77bb4e69b7ce6c38401e3b17aacf6d320fadd576b162bb5dcffd3efb851ce7c60ab739b177c89d10b267a030518470f3914164b8e2b9dd7034da77e1440bb8e4611d7853885e0ca1b16e79d02165f286e37276e0c077055dd8eb1d4fce3e95aac48df74b9f368a31b811a17dc043a47512e7346b0a6a14d4ff6f1e6ae65e184ec2582d'
}

User.findOne({ email: singleUser.email })
  .then((user) => {

    const finalUser = new User(singleUser);

    if (user)
      return;

    finalUser.save().then(res => {
      console.log('added user');
    })
  }).catch();
