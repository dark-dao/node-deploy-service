'use strict';

import express from 'express';
import cluster from 'cluster';
import _ from 'lodash';
import helmet from 'helmet';

import config from './config';
import { projects } from './projects.configuration.json';

const server = express();
const { host, port, baseRoute } = config;

export default () => {
    try {
/*=========================    Route handler    ==============================*/
        if(cluster.isMaster) {
            let timeoutExit;
            cluster.setupMaster({
                exec: './helpers/server-worker.js',
                silent: false
            });
            for(let i = 0; i < 2; i++) {
                let serverWorker = cluster.fork();
            }
            const workerDisconnection = (worker) => {
              console.log(`Отключение воркера ${worker.id}`);
              worker.disconnect();
              timeoutExit = setTimeout(() => {
                worker.kill();
              }, 2000);
            }
/*--------------------------    Error handler    -----------------------------*/
            cluster.on('disconnect', (worker, code, signal) => {
              clearTimeout(timeoutExit);
              console.warn(`Работа воркера #${worker.id} завершена`);
            });

            cluster.on('error', (err) => {
              console.error(err, 'Ошибка в воркере!');
            });

            cluster.on('exit', (worker, code, signal) => {
              console.warn('Сингнал выхода из процесса от воркера #', worker.id);
              worker.disconnect();
              timeoutExit = setTimeout(() => {
                worker.kill();
              }, 2000);
            });
/*----------------------------------------------------------------------------*/
            cluster.on('message', (worker, msg) => {
                if(msg.runExecution) {
                    const { selectedProject } = msg;
                    cluster.setupMaster({
                        exec: './helpers/worker-execution.js',
                        silent: false
                    });
                    let executionConfig = {};
                    executionConfig['executionConfig'] = selectedProject;
                    executionConfig['executionConfig'] = JSON.stringify(executionConfig['executionConfig']);
                    let executionWorker = cluster.fork(executionConfig);
                }
                if(msg.executionIsSuccess) {
                    workerDisconnection(worker);
                }
            });
        } else {
            console.log(`Воркер #${cluster.worker.id} запущен`);
        }
/*============================================================================*/
    } catch (e) {
        console.error(e);
    }
};
