const cron = require("node-cron");
const { notifications } = require("../db/models");
const { Op } = require("sequelize");

// Codziennie o 03:10
cron.schedule("10 3 * * *", async () => {
  console.log("CRON: usuwam stare powiadomienia...");

  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7); // 7 dni temu

    const deleted = await notifications.destroy({
      where: {
        createdAt: {
          [Op.lte]: cutoff,
        },
      },
    });

    console.log(`Usunięto ${deleted} starych powiadomień`);
  } catch (err) {
    console.error("CRON notifications cleanup error:", err);
  }
});
