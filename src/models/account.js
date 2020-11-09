const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('account', {
  id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.INTEGER,
  },
  username: {
    allowNull: false,
    type: DataTypes.STRING(50),
    unique: true,
  },
  password: {
    allowNull: false,
    type: DataTypes.STRING(200),
  },
  name: {
    allowNull: false,
    type: DataTypes.STRING(30),
  },
}, {
  timestamps: false,
  freezeTableName: true,
});
