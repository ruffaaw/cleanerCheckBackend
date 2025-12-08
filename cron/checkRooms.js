const cron = require("node-cron");
const { rooms, cleaningSession, notifications, user } = require("../db/models");
const { Op } = require("sequelize");
const { DateTime } = require("luxon");

// cron uruchamiany co 10 minut
cron.schedule("*/10 * * * *", async () => {
  console.log("CRON: sprawdzam pomieszczenia...");

  try {
    const oneHourAgo = DateTime.now().minus({ minute: 45 }).toJSDate();

    // pobieramy wszystkie pomieszczenia
    const allRooms = await rooms.findAll();

    for (const room of allRooms) {
      // sprawdzamy aktywną sesję
      const active = await cleaningSession.findOne({
        where: {
          roomId: room.id,
          endTime: null,
        },
      });

      if (active) continue;

      // sprawdzamy ostatnią skończoną sesję
      const last = await cleaningSession.findOne({
        where: {
          roomId: room.id,
          endTime: { [Op.ne]: null },
        },
        order: [["endTime", "DESC"]],
      });

      const lastEnd = last?.endTime || null;

      // jeśli nigdy nie sprzątane LUB ostatnia sesja > 60 minut temu
      const isDirty = !lastEnd || new Date(lastEnd) < oneHourAgo;

      if (!isDirty) continue;

      // pobieramy wszystkich użytkowników
      const allUsers = await user.findAll();

      const now = new Date();

      // dodajemy powiadomienia dla każdego usera
      const bulkData = allUsers.map((u) => ({
        userId: u.id,
        roomId: room.id,
        title: "Pomieszczenie wymaga sprzątania",
        message: `Pomieszczenie "${room.name}" nie było sprzątane od ponad godziny.\n`,
        date: now,
        isRead: false,
      }));

      await notifications.bulkCreate(bulkData);

      console.log(`CRON: Dodano powiadomienie dla pomieszczenia ${room.name}`);
    }
  } catch (err) {
    console.error("CRON ERROR:", err);
  }
});
