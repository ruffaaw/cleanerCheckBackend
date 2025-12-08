"use strict";

const workersData = require("../seed-data/workers.json");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    const dataWithTimestamps = workersData.map((worker) => ({
      ...worker,
      createdAt: now,
      updatedAt: now,
    }));

    await queryInterface.bulkInsert("workers", dataWithTimestamps);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("workers", null, {});
  },
};
