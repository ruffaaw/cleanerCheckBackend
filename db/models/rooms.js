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
    validate: {
      notNull: {
        msg: "name cannot be null",
      },
      notEmpty: {
        msg: "name cannot be empty",
      },
    },
  },
  createdAt: {
    allowNull: false,
    type: DataTypes.DATE,
  },
  updatedAt: {
    allowNull: false,
    type: DataTypes.DATE,
  },
});

module.exports = rooms;
