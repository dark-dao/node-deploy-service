'use strict';

import Promise from 'bluebird';
import nodemailer from 'nodemailer';

import config from '../config';

export default class Mailer {
  constructor(fileUrl, fileName, projectId) {
    this.mailTemplate = {
      from: config.notification.login, // sender address
      to: config.notification.recipientEmail, // list of receivers
      subject: 'Результаты деплоя', // Subject line
      priority: 'hight',
      text: `Деплой проекта ${projectId}`, // plain text body
      attachments: {
        fileName: projectId,
        path: fileUrl
      }
    }
    this.transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.notification.login,
        pass: config.notification.password
      }
    });
  }
  send() {
    return new Promise ((resolve, reject) => {
      return this.transport.sendMail(this.mailTemplate, (error, info) => {
        if(error) {
          return reject({success: false, message: 'Ошибка при отправке', error: error});
        } else {
          return resolve({success: true, message: 'Сообщение отправлено'});
        }
      });
    });
  }
}
