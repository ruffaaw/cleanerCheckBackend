"use strict";
const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const cleaningSessions = sequelize.define("cleaningSession", {
  id: {
    allowNull: false,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    type: DataTypes.UUID,
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  workerId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  roomId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
});

cleaningSessions.associate = (models) => {
  cleaningSessions.belongsTo(models.workers, { foreignKey: "workerId" });
  cleaningSessions.belongsTo(models.rooms, { foreignKey: "roomId" });
};

module.exports = cleaningSessions;
