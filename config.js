'use strict';

import path from 'path';

const config = {
    host: 'localhost',
    port: 5005,
    baseRoute: '/mySecretWebhookRoute',
    logsUrl: path.join(__dirname, './logs'),
    notification: {
      enable: true,
      login: 'example@mail.com',
      password: 'emailPassword',
      recipientEmail: 'recepient-email@mail.com'
    },
    whiteListIps: [ // bitbucket webhook ips or another...
        '34.198.203.127',
        '34.198.178.64',
        '34.198.32.85',
        '127.0.0.1'
    ]
};

export default config;
