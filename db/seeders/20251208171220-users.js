"use strict";

/** @type {import('sequelize-cli').Migration} */
const usersData = require("../seed-data/users.json");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    const dataWithTimestamps = usersData.map((user) => ({
      ...user,
      id: uuidv4(),
      userType: "0",
      password: bcrypt.hashSync(user.password, 13),
      createdAt: now,
      updatedAt: now,
    }));

    await queryInterface.bulkInsert("user", dataWithTimestamps);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("user", null, {});
  },
};
