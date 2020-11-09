const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('store_option', {
  id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.INTEGER,
  },
  option_name: {
    allowNull: false,
    type: DataTypes.STRING(20),
  },
  option_value: {
    allowNull: false,
    type: DataTypes.STRING(100),
  },
}, {
  timestamps: false,
  freezeTableName: true,
});
