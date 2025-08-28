const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Record = sequelize.define('Record', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  serialNo:        { type: DataTypes.STRING, allowNull: false, field: 'serialNo' },
  flightNo:        { type: DataTypes.STRING, allowNull: false, field: 'flightNo' },
  date:            { type: DataTypes.STRING, allowNull: false, field: 'date' },
  aircraftType:    { type: DataTypes.STRING, allowNull: false, field: 'aircraftType' },
  parkingStand:    { type: DataTypes.STRING, allowNull: false, field: 'parkingStand' },
  regNo:           { type: DataTypes.STRING, allowNull: false, field: 'regNo' },
  airline:         { type: DataTypes.STRING, allowNull: false, field: 'airline' },
  onBlock:         { type: DataTypes.STRING, allowNull: false, field: 'onBlock' },
  offBlock:        { type: DataTypes.STRING, allowNull: false, field: 'offBlock' },
  origin:          { type: DataTypes.STRING, allowNull: false, field: 'origin' },
  gpuStart:        { type: DataTypes.STRING, allowNull: false, field: 'gpuStart' },
  gpuEnd:          { type: DataTypes.STRING, allowNull: false, field: 'gpuEnd' },
  pcaStart:        { type: DataTypes.STRING, allowNull: false, field: 'pcaStart' },
  pcaEnd:          { type: DataTypes.STRING, allowNull: false, field: 'pcaEnd' },
  operatorName:    { type: DataTypes.STRING, allowNull: false, field: 'operatorName' },
  shift:           { type: DataTypes.STRING, allowNull: false, field: 'shift' },
  ghaName:         { type: DataTypes.STRING, allowNull: false, field: 'ghaName' },
  ghaSignature:    { type: DataTypes.TEXT, allowNull: true, field: 'gha_signature' },
}, {
  tableName: 'records',
  timestamps: true, // automatically adds createdAt and updatedAt
});

module.exports = Record;
