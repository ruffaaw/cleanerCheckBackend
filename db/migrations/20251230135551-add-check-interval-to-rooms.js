"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("rooms", "checkIntervalMinutes", {
      type: Sequelize.INTEGER,
      defaultValue: 60,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("rooms", "checkIntervalMinutes");
  },
};
