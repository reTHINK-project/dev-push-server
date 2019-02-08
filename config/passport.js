const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local');

mongoose.model('User');

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});

passport.use(new LocalStrategy(
    function (username, password, done) {

        const defaultUser = {
            username: 'user',
            password: 'pass'
        }

        if (defaultUser.username !== username) {
            return done(null, false, { message: 'Incorrect username.' });
        }
        if (defaultUser.password !== password) {
            return done(null, false, { message: 'Incorrect password.' });
        }
        return done(null, defaultUser);

        // User.findOne({ username: username }, function (err, user) {
        //   console.log(err, user);

        //   if (err) { return done(err); }
        //   if (!user) {
        //     return done(null, false, { message: 'Incorrect username.' });
        //   }
        //   if (!user.validPassword(password)) {
        //     return done(null, false, { message: 'Incorrect password.' });
        //   }
        //   return done(null, user);
        // });
        return done(null, {});
    }
));