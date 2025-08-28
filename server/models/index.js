const Sequelize = require('sequelize');
const sequelize = require('../config/db');

const Gate = require('./gateModel');

const db = {
  Sequelize,
  sequelize,
  Gate
};

module.exports = db;
