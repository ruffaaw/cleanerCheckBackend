const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const AppError = require("../../utils/appError");

const cleaningSessions = sequelize.define("cleaningSession", {
  id: {
    allowNull: false,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    type: DataTypes.UUID,
  },
  startTime: {
    defaultValue: DataTypes.NOW,
    allowNull: false,
    type: DataTypes.DATE,
  },
  endTime: {
    defaultValue: DataTypes.NOW,
    allowNull: true,
    type: DataTypes.DATE,
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  workerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: "workers",
      key: "id",
    },
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  },
  roomId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: "rooms",
      key: "id",
    },
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  },
});

module.exports = cleaningSessions;
