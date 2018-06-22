'use strict';
import Promise from 'bluebird';
import fs from 'fs';
import path from 'path';
import uuidv4 from 'uuid/v4';
import moment from 'moment';

import config from '../config';

const fileHeader = '=============================';

export default class Logger {
    constructor(projectName) {
        this.projectName = projectName;
        const uuid = uuidv4();
        this.fileName = `${this._getTimeStamp()}-${projectName}-${uuid}.log`;
        this.fileUrl = path.join(config.logsUrl, this.fileName);
        this.fileIsCreated = false;
        this.stepNumber = 0;
    }
    _getTimeStamp() {
        return moment().format('DD-MM-YYYY_HH-mm-ss');
    }
    _createFile() {
        const headerText = `${fileHeader}  ${this.projectName}  ${fileHeader}\n`;
        return new Promise ((resolve, reject) => {
            fs.writeFile(this.fileUrl, headerText, (error) => {
                if(error) {
                    console.error('Ошибка при создании лог-файла', error);
                    return reject(error);
                } else {
                    return resolve({ fileUrl: this.fileUrl });
                }
            });
        });
    }
    _writeToFile(text) {
        const logsText = `STEP: {${this.stepNumber}} ${this._getTimeStamp()}:\n ${text} \n`;
        return new Promise ((resolve, reject) => {
            fs.appendFile(this.fileUrl, logsText, 'utf8',(error) => {
                if(error) {
                    console.error('Ошибка при записи в лог-файл', error);
                    return reject(error);
                } else {
                    return resolve({ fileUrl: this.fileUrl });
                }
            });
        });
    }
    setLog(text) {
        let formatedText = text.toString();
        if(this.stepNumber === 0) {
            this._createFile().then(success => success, err => err).catch(err => err);
        }
        this.stepNumber++;
        this._writeToFile(formatedText).then(success => success, err => err).catch(err => err);
    }
    setErrorLog(text) {
        return new Promise ((resolve, reject) => {
            let formatedText = JSON.stringify(text).toString();
            formatedText = `ERROR ${formatedText}`;
            if(this.stepNumber === 0) {
                this._createFile().then(success => {
                    return resolve(success);
                }, err => {
                    return reject(err);
                }).catch(err => {
                    return reject(err);
                });
            }
            this.stepNumber++;
            this._writeToFile(formatedText).then(success => {
                return resolve(success);
            }, err => {
                return reject(err);
            }).catch(err => {
                return reject(err);
            });
        });
    }
    getFileInfo() {
      return {fileName: this.fileName, fileUrl: this.fileUrl};
    }
};
