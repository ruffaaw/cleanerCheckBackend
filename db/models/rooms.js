"use strict";
const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const rooms = sequelize.define("rooms", {
  id: {
    allowNull: false,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    type: DataTypes.UUID,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  checkIntervalMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 60,
  },
  createdAt: {
    allowNull: false,
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    allowNull: false,
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

rooms.associate = (models) => {
  rooms.hasMany(models.cleaningSession, { foreignKey: "roomId" });
  rooms.hasMany(models.cleaningSession, {
    foreignKey: "roomId",
    as: "lastSession",
  });
};

module.exports = rooms;
