const express = require('express');
const app = express();
const path = require('path');
const { corsDefault, corsCustom } = require('./utility/corsUtil');
const { systemClieantName } = require('./config/constantList');
const publicRoutes = require('./router/publicRouterconfig');
const privatRoutes = require('./router/privatRouterconfig');
const bodyParser = require('body-parser');
const logger = require('./utility/logManager');
const mysqlManager = require('./utility/session/mysqlManager');
const interceptorConfig = require('./routerIntercepter/config');
const interceptor = require('./routerIntercepter/interceptorManager');

if (process.env.NODE_ENV === 'development') {
  app.use(corsDefault());
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

mysqlManager.sessionMysqlIni(app);
interceptor.init(app, interceptorConfig);

app.use('/', express.static(path.join(__dirname, '../' + systemClieantName + '-client-react/build')));
app.get('/', (request, response) => {
  response.sendFile(path.join(__dirname, '../' + systemClieantName + '-client-react/build/index.html'));
});

app.use('/public', publicRoutes);
app.use('/privat', privatRoutes);

app.get('*', (request, response) => {
  const requestedPath = request.path;
  logger.setDebug(__filename, `*.Path === ${requestedPath}`);
  response.redirect('/');
});

app.use((request, response, next) => {
  const requestedPath = request.path;
  logger.setDebug(__filename, `Requested 404 path: ${requestedPath}`);
  response.status(404).send("요청할수 없는 경로 입니다.");
});

app.use((error, request, response, next) => {
  logger.setError(__filename, 'SERVER-LAST-ROUTER [originalUrl:' + request.originalUrl + '][ERROR:' + error + ']');
  response.setHeader('Content-Type', 'text/html; charset=utf-8');
  response.write("<script>alert('예외(SERVER-LAST-ROUTER-ERROR)가 발생하였습니다.')</script>");
  response.write("<script>window.location=\"/\"</script>");
  response.end();
});

module.exports = app;