'use strict';

import config from '../config';

export default class {
    constructor() {
        const { whiteListIps } = config;
        this.whiteListIps = whiteListIps;
    }
    checkIp(req, res, next) {
        let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        ip = ip.split(',')[0];
        ip = ip.split(':').slice(-1);
        ip = `${ip}`;
        console.log(ip);
        let isValid = false;

        this.whiteListIps.map((item) => {
          if(item == ip) {
            isValid = true;
          }
        });
        if(isValid) {
          next();
        } else {
          return res.status(500);
        }
    }
}
