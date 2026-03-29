const express = require('express');
const passport = require('passport');
const router = express.Router();

// 1. Redirect to Facebook
router.get('/facebook', 
  passport.authenticate('facebook', { 
    scope: ['public_profile', 'pages_show_list', 'pages_read_engagement', 'pages_manage_metadata', 'pages_messaging'] 
  })
);

// 2. Callback from Facebook
router.get('/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, redirect to frontend dashboard
    // In a real app, we'd typically redirect or send a JWT
    // For now we assume redirecting back to localhost:5173
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/dashboard`);
  }
);

// 3. User data check
router.get('/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});

// 4. Logout
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: 'Logged out' });
  });
});

module.exports = router;
