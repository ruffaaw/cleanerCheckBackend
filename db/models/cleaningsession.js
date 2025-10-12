const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const AppError = require("../../utils/appError");

const cleaningSessions = sequelize.define("cleaningSession", {
  startTime: {
    defaultValue: DataTypes.NOW,
    allowNull: false,
    type: DataTypes.DATE,
  },
  updatedAt: {
    allowNull: false,
    type: DataTypes.DATE,
  },
});

module.exports = cleaningSessions;
