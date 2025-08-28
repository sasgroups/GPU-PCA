const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // adjust if needed

const Gate = sequelize.define('Gate', {
  serial_no: {
    type: DataTypes.BIGINT,
    allowNull: false,
    unique: true
  },
  gate_name: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

module.exports = Gate;
