const Greenlock = require('greenlock-express');
const logger = require('./utility/logManager');

// '../SSL/greenlock.d' 위치의 자동인증 무료 ssl 사용을위한 소스 https://letsencrypt.org/ 참고 할 것
// 고정IP 및 도메인 필요함 (유동IP 및 무료도메인도 사용은 가능하나 인증서 생성 및 갱신 에서 오류날수 있음)
const initGreenLockExpress = (app, port, sport, host, callback) => {
    try {
        Greenlock.init({
            packageRoot: __dirname,
            configDir: '../SSL/greenlock.d',
            maintainerEmail: 'gun2532270@gmail.com',
            cluster: false,
            notify: (event, details) => {
                logger.setInfo(__filename, `Greenlock notify event : ${event}`);
                logger.setInfo(__filename, `Greenlock Error : ${details}`);
                logger.setInfo(__filename, `Certificate renewed for : ${details.subject}`);
                logger.setInfo(__filename, `Challenge : ${details}`);
            },
        }).ready((glx) =>  {
            let httpServer = glx.httpServer(app);
            httpServer.listen(port, host, () => {
                const address = httpsServer.address();
                logger.setInfo(__filename, `GreenLockExpress http Listening on [ ${address.family} : ${address.address} : ${address.port} ]`);
            });

            let httpsServer = glx.httpsServer(null, app);
            httpsServer.listen(sport, host, () => {
                const address = httpsServer.address();
                logger.setInfo(__filename, `GreenLockExpress https Listening on [ ${address.family} : ${address.address} : ${address.port} ]`);
            });
            callback(httpsServer);
        });
    } catch (error) {
        logger.setInfo(__filename, `initGreenLockExpress.error ${error}`);
        callback(null);
    }
}

module.exports = {
    initGreenLockExpress,
}