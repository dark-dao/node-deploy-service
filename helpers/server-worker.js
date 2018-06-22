'use strict';
require('babel-polyfill');  // Provides polyfills necessary for a full ES2015+ environment
require('babel-register'); // babel require hook

const express = require('express');
const helmet = require('helmet');

const server = express();
//const { host, port, baseRoute, projects } = JSON.parse(process.env['serverConfig']);
const { projects } = require('../projects.configuration.json');
const { host, port, baseRoute }  = require('../config').default;

try {
    server.use(helmet());

    server.route(`${baseRoute}/*`)
    .all((req, res, next) => {
        const url = req.params['0'];
        let isExist = false;
        projects.map((project) => {
            if(project.route === url) {
                isExist = true;
                res.selectedProject = project;
            }
        });
        if(isExist) {
            next();
        } else {
            res.status(404).end();
        }
    })
    .get((req, res, next) => {
        const { selectedProject } = res;
        process.send({runExecution: true, selectedProject});
        res.status(200).end();
    });
    server.listen(port, (err) => {
        if(err) {
            console.error('Error of starting service', err);
            process.exit();
        } else {
            console.log(`Deploy service is run on ${port}`);
        }
    });
    process.on('uncaughtException', e => {
        console.error('Непредвиденная ошибка uncaughtException: ', e);
        process.exit();
    });
    process.on('message', (obj) => {

    });
} catch (e) {
    console.error('Ошибка: ', e);
    process.exit();
}
