const cron = require("node-cron");
const { cleaningSession } = require("../db/models");
const { Op } = require("sequelize");

// Usuwanie sesji starszych niż 40 dni
cron.schedule("0 3 * * *", async () => {
  console.log("CRON: usuwam stare sesje...");

  // Uruchamia się codziennie o 03:00 w nocy
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 40);

    const deleted = await cleaningSession.destroy({
      where: {
        endTime: {
          [Op.lte]: cutoff,
        },
      },
    });

    console.log(`Usunięto ${deleted} starych cleaningSessions`);
  } catch (err) {
    console.error("CRON error:", err);
  }
});
