import express from 'express';
import dotenv from 'dotenv';
import webpack from 'webpack';
import React from 'react';
import helmet from 'helmet';

import cookieParser from 'cookie-parser';
import boom from '@hapi/boom';
import passport from 'passport';
import axios from 'axios';

import { renderToString } from 'react-dom/server';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { StaticRouter } from 'react-router-dom';
import { renderRoutes } from 'react-router-config';

import reducer from '../frontend/reducers';
import serverRoutes from '../frontend/routes/ServerRoutes';

import Layout from '../frontend/components/Layout';

import getManifest from './getManifest';

const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const webpackConfig = require('../../webpack.config');

const app = express();

dotenv.config();

const { ENV, PORT, API_URL } = process.env;

//Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());

//Basic strategy
require('./utils/auth/strategies/basic');

if (ENV === 'development') {
  const compiler = webpack(webpackConfig);
  const serverConfig = {};
  app.use(webpackDevMiddleware(compiler, serverConfig));
  app.use(webpackHotMiddleware(compiler));
} else {
  app.use((req, res, next) => {
    if (!req.hashManifest) req.hashManifest = getManifest();
    next();
  });
  app.use(express.static(`${__dirname}/public`));
  app.use(helmet());
  app.use(helmet.permittedCrossDomainPolicies());
  app.disable('x-powered-by');
}

const setResponse = (html, preloadedState, manifest) => {
  const mainStyles = manifest ? manifest['main.css'] : 'assets/app.css';
  const mainBuild = manifest ? manifest['main.js'] : 'assets/app.js';
  const mainVendor = manifest ? manifest['vendor.js'] : 'assets/vendor.js';

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="ie=edge">
      <link rel="stylesheet" href=${mainStyles} type="text/css">
      <title>Platzi Video</title>
  </head>
  <body>
      <div id="app">${html}</div>
      <script> window.__PRELOADED_STATE__ = ${JSON.stringify(
        preloadedState
      ).replace(/</g, '\\u003c')}
      </script>
      <script src=${mainVendor} type="text/javascript"></script>
      <script src=${mainBuild} type="text/javascript"></script>
  </body>
  </html>
  `;
};

const renderApp = async (req, res) => {
  let initialState;
  const { email, name, id, token } = req.cookies;

  try {
    const { data: dataMovie } = await axios({
      url: `${API_URL}/api/movies`,
      method: 'get',
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    const { data: dataUser } = await axios({
      url: `${API_URL}/api/user-movies/?userId=${id}`,
      method: 'get',
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    const { data: movieList } = dataMovie;
    const { data: userList } = dataUser;

    initialState = {
      user: {
        id,
        email,
        name,
      },
      mylist: userList.map((itemUser) =>
        movieList.find((itemMovie) => itemMovie._id === itemUser.movieId)
      ),
      trends: movieList.filter(
        (movie) => movie.contentRating === 'PG' && movie._id
      ),
      originals: movieList.filter(
        (movie) => movie.contentRating === 'G' && movie._id
      ),
    };
  } catch (error) {
    initialState = {
      user: {},
      mylist: [],
      trends: [],
      originals: [],
    };
  }

  const store = createStore(reducer, initialState);
  const preloadedState = store.getState();
  const isLogged = initialState.user.id;
  const html = renderToString(
    <Provider store={store}>
      <StaticRouter location={req.url} context={{}}>
        <Layout>{renderRoutes(serverRoutes(isLogged))}</Layout>
      </StaticRouter>
    </Provider>
  );

  res.send(setResponse(html, preloadedState, req.hashManifest));
};

app.post('/auth/sign-in', async (req, res, next) => {
  passport.authenticate('basic', (error, data) => {
    try {
      if (error || !data) {
        next(boom.unauthorized());
      }
      req.login(data, { session: false }, async (error) => {
        if (error) {
          next(error);
        }
        const { token, ...user } = data;

        res.cookie('token', token, {
          httpOnly: ENV !== 'development',
          secure: ENV !== 'development',
        });
        res.status(200).json(user);
      });
    } catch (error) {
      next(error);
    }
  })(req, res, next);
});

app.post('/auth/sign-up', async (req, res, next) => {
  const { body: user } = req;
  try {
    const { data } = await axios({
      url: `${API_URL}/api/auth/sign-up`,
      method: 'post',
      data: {
        email: user.email,
        name: user.name,
        password: user.password,
      },
    });
    res.status(201).json({
      name: req.body.name,
      email: req.body.email,
      id: data.id,
      message: 'User Created',
    });
  } catch (error) {
    next(error);
  }
});

app.post('/user-movies', async (req, res, next) => {
  try {
    const { body: userMovie } = req;
    const { token, id: userId } = req.cookies;

    const { data, status } = await axios({
      url: `${API_URL}/api/user-movies`,
      headers: { Authorization: `Bearer ${token}` },
      method: 'post',
      data: {
        movieId: userMovie._id,
        userId,
      },
    });

    if (status !== 201) {
      next(boom.badImplementation());
    }

    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

app.delete('/user-movies', async (req, res, next) => {
  try {
    const { movieId } = req.query;
    const { token, id: userId } = req.cookies;

    const { data, status } = await axios({
      url: `${API_URL}/api/user-movies/?movieId=${movieId}&userId=${userId}`,
      headers: { Authorization: `Bearer ${token}` },
      method: 'delete',
    });

    if (status !== 200) {
      next(boom.badImplementation());
    }

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
});

app.get('*', renderApp);

app.listen(PORT, (err) => {
  if (err) console.error(err);
  else console.log(`Server listen on http://localhost:${PORT}`);
});
