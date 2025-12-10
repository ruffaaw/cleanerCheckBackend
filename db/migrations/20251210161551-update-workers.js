"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("workers", "workerType", {
      type: Sequelize.ENUM("0", "1"),
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("workers", "workerType");
  },
};
