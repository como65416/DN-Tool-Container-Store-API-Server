const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('package', {
  id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.INTEGER,
  },
  version: {
    allowNull: false,
    type: DataTypes.STRING(20),
  },
  name: {
    allowNull: true,
    type: DataTypes.STRING(60),
  },
  icon_filename: {
    allowNull: true,
    type: DataTypes.STRING(80),
  },
  description: {
    allowNull: false,
    type: DataTypes.STRING(300),
  },
  package_filename: {
    allowNull: true,
    type: DataTypes.STRING(80),
  },
  publish_username: {
    allowNull: false,
    type: DataTypes.STRING(50),
  },
  status: {
    allowNull: false,
    type: DataTypes.STRING(10),
  },
}, {
  timestamps: false,
  freezeTableName: true,
  indexes: [
    { unique: false, fields: ['publish_username'] },
    { unique: false, fields: ['status'] },
  ],
});
