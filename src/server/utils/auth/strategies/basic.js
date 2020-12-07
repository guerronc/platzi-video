const passport = require('passport');
const { BasicStrategy } = require('passport-http');
const boom = require('@hapi/boom');
const axios = require('axios');

require('dotenv').config();

const { API_URL, API_KEY_TOKEN } = process.env;

passport.use(
  new BasicStrategy(async (email, password, callback) => {
    try {
      const { data, status } = await axios({
        url: `${API_URL}/api/auth/sign-in`,
        method: 'post',
        auth: {
          password,
          username: email,
        },
        data: {
          apiKeyToken: API_KEY_TOKEN,
        },
      });

      if (!data || status !== 200) {
        return callback(boom.unauthorized(), false);
      }

      return callback(null, data);
    } catch (error) {
      return callback(error);
    }
  })
);
