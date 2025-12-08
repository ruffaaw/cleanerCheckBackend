"use strict";

require("dotenv").config();
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "user",
      [
        {
          id: uuidv4(),
          name: process.env.ADMIN_NAME,
          password: bcrypt.hashSync(process.env.ADMIN_PASSWORD, 13),
          userType: process.env.ADMIN_USER_TYPE,
          resetPassword: process.env.ADMIN_RESET_PASSWORD,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("user", null, {});
  },
};
