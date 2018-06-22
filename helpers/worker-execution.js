'use strict';
require('babel-polyfill');  // Provides polyfills necessary for a full ES2015+ environment
require('babel-register'); // babel require hook

const { exec } = require('child_process');
const path = require('path');
const Promise = require('bluebird');
const iconv = require('iconv-lite');

const config = require('../config').default;
let Logger = require('./logger').default;
let Mailer = require('./mailer').default;

const { id, route, url, commands } = JSON.parse(process.env['executionConfig']);
const cyanColor = '\x1b[36m';
const greenColor = '\x1b[32m';
const resetColor = '\x1b[37m';
const logger = new Logger(id);

try {
    console.log(`Старт выполнения команд для проекта ${id}`);

    const runCommand = (params) => {
        return new Promise ((resolve, reject) => {
            const { url, command } = params;
            console.log(`Начато выполнение команды ${cyanColor} ${command} ${resetColor}`);
            return exec(command, { encoding: 'utf8' }, (err, stdout, stderr) => {
                if(!err) {
                    resolve(stdout);
                } else {
                    reject({ command, err, stderr });
                }
            });
        });
    };

    const processStop = (isSuccess) => {
      const { fileUrl, fileName } = logger.getFileInfo();
      const mailer = new Mailer(fileUrl, fileName, id);
      if(config.notification.enable) {
        mailer.send().then((success) => {
          logger.setLog('---- Notification is sended! ----');
          if(isSuccess) {
            process.send({executionIsSuccess: true});
          } else {
            process.exit();
          }
        }, (error) => {
          logger.setLog('---- Notification not sended! ----');
          logger.setLog(error);
          if(isSuccess) {
            process.send({executionIsSuccess: true});
          } else {
            process.exit();
          }
        }).catch((error) => {
          logger.setLog('---- Notification not sended! ----');
          logger.setLog(error);
          if(isSuccess) {
            process.send({executionIsSuccess: true});
          } else {
            process.exit();
          }
        });
      } else {
        if(isSuccess) {
          process.send({executionIsSuccess: true});
        } else {
          process.exit();
        }
      }
    }

    process.chdir(url);

    const chain = function*() {
        for(let i = 0; i < commands.length; i++) {
            logger.setLog(commands[i]);
            yield runCommand({url, command: commands[i]});
        }
        return 'done';
    };

    const execute = (generator, yieldValue) => {
        let next = generator.next(yieldValue);
        if (!next.done) {
            next.value.then((result) => {
                console.log(`Результат:\n ${greenColor} ${result} ${resetColor}`);
                logger.setLog(result);
                execute(generator, result);
            }, (fail) => {
                const { command, err, stderr } = fail;
                console.error(`Ошибка при выполнении команды: ${command}\n ${stderr}\n ${err}`);

                logger.setErrorLog(fail).then(success => {
                    processStop(false);
                }).catch(e => {
                    processStop(false);
                });

            }).catch((error) => {
                console.error(`Ошибка\n ${error}`);

                logger.setErrorLog(error).then(success => {
                    processStop(false);
                }).catch(e => {
                    processStop(false);
                });
            });
        } else {
          console.log(`Все команды успешно выполнены!`);
          logger.setLog('---- success ----');
          if(config.notification.enable) {
            processStop(true);
          } else {
            process.send({executionIsSuccess: true});
          }
        }
    };
    execute( chain() );

    process.on('uncaughtException', e => {
        console.error('Непредвиденная ошибка uncaughtException: ', e);
        logger.setErrorLog(e).then(success => {
            processStop(false);
        }).catch(e => {
            processStop(false);
        });
    });
    process.on('message', function(obj) {

    });
} catch (e) {
    console.error('Ошибка: ', e.toString());
    logger.setErrorLog(e).then(success => {
        processStop(false);
    }).catch(e => {
        processStop(false);
    });
}
