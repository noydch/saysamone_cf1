const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const Customer = require('../models/Customer');

passport.serializeUser((user, done) => {
  done(null, user._id || user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await Customer.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

passport.use(new FacebookStrategy({
    clientID: process.env.FB_APP_ID,
    clientSecret: process.env.FB_APP_SECRET,
    callbackURL: "http://localhost:5000/api/auth/facebook/callback",
    profileFields: ['id', 'displayName', 'photos', 'email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists
      let user = await Customer.findOne({ facebookId: profile.id });
      
      if (!user) {
        // Create new user if not exists
        user = await Customer.create({
          facebookId: profile.id,
          name: profile.displayName,
          profilePic: profile.photos ? profile.photos[0].value : ''
        });
      }
      
      // Store the accessToken in the user object (temporarily for the session)
      // Note: In production you might want to save this to DB
      const userWithToken = user.toObject();
      userWithToken.accessToken = accessToken;
      
      return done(null, userWithToken);
    } catch (err) {
      return done(err, null);
    }
  }
));

module.exports = passport;
