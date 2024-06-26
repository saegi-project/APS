const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const logger = require('./utility/logManager');
const { X509Certificate } = require('crypto');

const getSSL = (credentials, credentCheck, app) => {
    const server = (credentCheck) ? https.createServer(credentials, app) : http.createServer(app);
    logger.setDebug(__filename, (credentCheck) ? `https-server-setting` : `http-server-setting`);
    return server;
}

const setSSL = () => {
    let credentials = { key:null, cert:null };
    let credentCheck = false; 
    try {
        const keyPath = path.join(__dirname, '../SSL/server.key');
        const certPath = path.join(__dirname, '../SSL/server.crt');
        const key = fs.readFileSync(keyPath);
        const cert = fs.readFileSync(certPath);

        const certData = cert.toString();
        const certBegin = certData.indexOf('-----BEGIN CERTIFICATE-----');
        const certEnd = certData.indexOf('-----END CERTIFICATE-----');
        const certText = certData.substring(certBegin, certEnd + '-----END CERTIFICATE-----'.length);
        const certObject = new X509Certificate(certText);
        const validTo = certObject.validTo;

        const ceDay = new Date(validTo);
        const toDay = new Date();
        const diffTime = ceDay - toDay;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 0) {
            credentials = {
                key: key,
                cert: cert
            };
            credentCheck = true;
            logger.setInfo(__filename, `SSL 인증서 만료일자(${ceDay.toISOString().slice(0, 10)})까지 ${diffDays}일`);
        } else {
            logger.setInfo(__filename, `SSL 인증서 만료됨`);
        }
    } catch (error) {
        console.log('Valid To:', error);
        logger.setError(__filename, `getSslFile.error : ${error}`);
    }
    return [ credentials, credentCheck ];
}

module.exports = {
    getSSL,
    setSSL,
}