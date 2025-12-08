"use strict";

const roomsData = require("../seed-data/rooms.json");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    const dataWithTimestamps = roomsData.map((room) => ({
      ...room,
      createdAt: now,
      updatedAt: now,
    }));

    await queryInterface.bulkInsert("rooms", dataWithTimestamps);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("rooms", null, {});
  },
};
