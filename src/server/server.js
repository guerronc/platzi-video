import express from "express";
import dotenv from "dotenv";
import webpack from "webpack";
import React from "react";
import helmet from "helmet";

import { renderToString } from "react-dom/server";
import { Provider } from "react-redux";
import { createStore } from "redux";
import { StaticRouter } from "react-router-dom";
import { renderRoutes } from "react-router-config";

import reducer from "../frontend/reducers";
import initialState from "../frontend/initialState";
import serverRoutes from "../frontend/routes/ServerRoutes";

import Layout from "../frontend/components/Layout";
const app = express();

dotenv.config();

const { ENV, PORT } = process.env;

if (ENV === "development") {
  const webpackConfig = require("../../webpack.config");
  const webpackDevMiddleware = require("webpack-dev-middleware");
  const webpackHotMiddleware = require("webpack-hot-middleware");

  const compiler = webpack(webpackConfig);
  const serverConfig = {};
  app.use(webpackDevMiddleware(compiler, serverConfig));
  app.use(webpackHotMiddleware(compiler));
} else {
  app.use(express.static(`${__dirname}/public`));
  app.use(helmet());
  app.use(helmet.permittedCrossDomainPolicies());
  app.disable("x-powered-by");
}

const setResponse = (html, preloadedState) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="ie=edge">
      <link rel="stylesheet" href="assets/app.css" type="text/css">
      <title>Platzi Video</title>
  </head>
  <body>
      <div id="app">${html}</div>
      <script> window.__PRELOADED_STATE__ = ${JSON.stringify(
        preloadedState
      ).replace(/</g, "\\u003c")}
      </script>
      <script src="assets/app.js" type="text/javascript"></script>
  </body>
  </html>
  `;
};

const renderApp = (req, res) => {
  const store = createStore(reducer, initialState);
  const preloadedState = store.getState();
  const html = renderToString(
    <Provider store={store}>
      <StaticRouter location={req.url} context={{}}>
        <Layout>{renderRoutes(serverRoutes)}</Layout>
      </StaticRouter>
    </Provider>
  );

  res.send(setResponse(html, preloadedState));
};

app.get("*", renderApp);

app.listen(PORT, (err) => {
  if (err) console.error(err);
  else console.log(`Server listen on port ${PORT}`);
});
