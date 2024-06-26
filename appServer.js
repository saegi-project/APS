const express = require('express');
const app = require('./app');
const openSSL = require('./openSSL');
const greenLockExpress = require('./greenLockExpress');
const workerManager = require('./utility/thread/workerManager');
const webSocketManager = require('./utility/webSocketManager');
const cronUtil = require('./utility/cronUtil');
const fileUtil = require('./models/sys/file/fileUtil');
const logger = require('./utility/logManager');

try {
  if (false) {
    //if (process.env.NODE_ENV === 'production') {
    // 고정IP 및 DNS 가입후 사용할것
    greenLockExpress.initGreenLockExpress(app, 80, 443, '0.0.0.0', (webServer) => {
      if (webServer != null) {
        webSocketManager.serverCreate(webServer);
        workerManager.threadCreate(`appThread`, `Thread-Work-start`);
        cronUtil.appCronWeighbridge();
        fileUtil.dataPathCheck();
        logger.setInfo(__filename, `web-Soket start ready`);
      } else {
        logger.setInfo(__filename, `web-Soket start failed`);
      }
    });
  } else {
    const _HOST = '0.0.0.0';
    const _PORT_HTTP = 8888;
    const _PORT_HTTPS = 8889;

    (callback => {
      const [credentials, credentCheck] = openSSL.setSSL();
      let callbackServer = null;
      const _SERVER = openSSL.getSSL(credentials, credentCheck, app);
      if (credentCheck) {
        const redirectServer = express();
        redirectServer.use((req, res, next) => {
          let protocol = req.headers['X-Forwarded-Proto'] || req.protocol;
          credentCheck && 'http' === protocol ? res.redirect(`https://${req.headers.host.replace(/:\d+$/, '')}:${_PORT_HTTPS}${req.url}`) : next();
        });
        redirectServer.listen(_PORT_HTTP, _HOST, () => {
          logger.setInfo(__filename, `Http.listen[ host:${_HOST} ][ port:${_PORT_HTTP} ]`);
        });
        _SERVER.listen(_PORT_HTTPS, _HOST, () => {
          logger.setInfo(__filename, `Https.listen[ host:${_HOST} ][ port:${_PORT_HTTPS} ]`);
        });
        callbackServer = _SERVER;
      } else {
        const http = require('http');
        const httpServer = http.createServer(app);
        httpServer.listen(_PORT_HTTP, _HOST, () => {
          logger.setInfo(__filename, `Http.listen[ host:${_HOST} ][ port:${_PORT_HTTP} ]`);
        });
        callbackServer = httpServer;
      }
      callback(callbackServer);
    })((webServer) => {
      if (webServer != null) {
        webSocketManager.serverCreate(webServer);
        workerManager.threadCreate(`appThread`, `Thread-Work-start`);
        cronUtil.appCronWeighbridge();
        fileUtil.dataPathCheck();
        logger.setInfo(__filename, `web-Soket start ready`);
      } else {
        logger.setInfo(__filename, `web-Soket start failed`);
      }
    });
  }
} catch (error) {
  logger.setError(__filename, `Server-Starting-Error:` + error);
}