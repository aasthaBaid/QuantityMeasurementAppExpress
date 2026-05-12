const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const QuantityHistory = sequelize.define("QuantityHistory", {
  operation: {
    type: DataTypes.STRING,
    allowNull: false
  },
  result: {
    type: DataTypes.FLOAT,
    allowNull: false
  }
});

module.exports = QuantityHistory;