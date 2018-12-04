const express = require('express');
const webpush = require('web-push');
const mongoose = require('mongoose');

const publicVapidKey = 'BKlOPcEel9zWecQsMCCwmaGIR7Sn6R85d5GSferRw3O8MMBbVeyjsUUynoKwOtnKAdWwYyhHtN-zp7NsWSMq7MQ';
const privateVapidKey = 'quY8wOageM5yhY0Tp9M1LHHv6hP0vPLoxOU2e4rMzjM';

// Replace with your email
webpush.setVapidDetails('mailto:rafaelfelgueiras1993@gmail.com', publicVapidKey, privateVapidKey);

const app = express();

app.use(require('body-parser').json());

// mongo
mongoose.connect('mongodb://localhost/test');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  // we're connected!
  console.log('connected to Mongo');

});

// schema
var subscriptionSchema = new mongoose.Schema({
  subscription: Object
});

// schema -> model
var Subscription = mongoose.model('subscription', subscriptionSchema);


// listen for subscriptions
app.post('/subscribe', (req, res) => {
  console.log(req.body);
  
  const subscription = req.body;
  res.status(201).json({});
 

  // create document
  var sub = new Subscription({ subscription: subscription });

  // save
  sub.save(function (err, fluffy) {
    if (err) return console.error(err);
    console.log('saved');
  });

});

app.post('/delete', (req, res) => {
  // const subscription = req.body;
  console.log('deleted all');
  res.status(201).json({});
  Subscription.deleteMany({}, function (err) { });

});

app.post('/send', (req, res) => {
  // const subscription = req.body;
  res.status(201).json({});
  console.log('SENDING');
  
  const payload = JSON.stringify(
    {
      title: 'Novo inquérito!',
      actions: [
        {
          action: 'inquiry-https://www.sapo.pt', title: 'Ir para o quiz!',
          // icon: 'images/checkmark.png'
        },
        {
          action: 'close', title: 'Fechar notificação',
          // icon: 'images/xmark.png'
        },
      ]
    }
  );
  Subscription.find(function (err, subs) {
    if (err) return console.error(err);
    
    subs.forEach(sub => {
      console.log('Sub: ', sub);
      webpush.sendNotification(sub.subscription, payload).catch(error => {
        console.error(error.stack);
      });

    });
  })
});

app.use(require('express-static')('./'));

app.listen(3000);
