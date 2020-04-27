const express = require('express');
const authRouter = express.Router();
const jsonBodyParser = express.json();
const AuthService = require('./auth-service');
const { requireAuth } = require('../middleware/jwt-auth');


authRouter.post('/login', jsonBodyParser, (req, res, next) => {
  const {user_name, password} =req.body;
  const credentials = {user_name, password};
  for (const [key, value] of Object.entries(credentials)) {
    // eslint-disable-next-line eqeqeq
    if (value == null)
      return res.status(400).json({
        error: `You are missing your ${key}`
      });}
  AuthService.getUserWithUserName(
    req.app.get('db'),
    credentials.user_name
  )
    .then(dbUser => {
      if (!dbUser)
        return res.status(400).json({
          error: 'Invalid Credentials'
        });
      AuthService.comparePasswords(credentials.password, dbUser.password)
        .then(compare => {
          if (!compare)
            return res.status(400).json({
              error: 'Invalid Credentials'
            });
          const sub = dbUser.user_name;
          const payload = { user_id: dbUser.id };
          res.send({
            authToken: AuthService.createJwt(sub, payload),
          });
        });
    })
    .catch(next);
});

module.exports = authRouter;