const { Sequelize } = require('sequelize');
require('dotenv').config();

const { initDBLogger: initLogger } = require('../../logger');
const logger = initLogger('Sequelize')
const initModels = require('./init-models');
const sequelize = new Sequelize(
    process.env.DATABASE_MARIA,
    process.env.USERNAME_MARIA,
    process.env.PASSWORD_MARIA,
    {
        host: process.env.HOST_MARIA,
        dialect: process.env.DIALECT_MARIA || 'mariadb',
        port: process.env.PORT_MARIA,
        // logging: false,
        logging: (msg, options) => logger.info(msg.replace(/(\r\n|\r|\n)/g, ' '), { method: options.type ?? null, data: { where: options.where ?? null, bind: options.bind ?? null } }),
    },
);
const models = initModels(sequelize);
module.exports = {
    sequelize,
    ...models,
};