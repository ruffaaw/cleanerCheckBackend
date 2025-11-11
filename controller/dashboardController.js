const { workers, cleaningSession, rooms } = require("../db/models");

const formatWarsawTime = (date) =>
  date
    ? DateTime.fromJSDate(new Date(date))
        .setZone("Europe/Warsaw")
        .toFormat("yyyy-MM-dd HH:mm:ss")
    : null;

const getWorkersDashboard = async (req, res) => {
  const data = await workers.findAll({
    attributes: ["id", "name"],
    include: [
      {
        model: cleaningSession,
        where: { endTime: null },
        required: false,
        include: [
          {
            model: rooms,
            // as: "room",
            attributes: ["name"],
          },
        ],
      },
    ],
  });

  const formatted = data.map((worker) => ({
    id: worker.id,
    name: worker.name,
    isCleaning: worker.cleaningSessions.length > 0,
    currentRoom: worker.cleaningSessions[0]?.room?.name || null,
  }));

  res.json({
    status: "success",
    data: formatted,
  });
};

const getWorkerDetails = async (req, res) => {
  const { id } = req.params;

  const sessions = await cleaningSession.findAll({
    where: { workerId: id },
    include: [{ model: rooms, attributes: ["name"] }],
    order: [["startTime", "DESC"]],
  });

  const formatted = sessions.map((s) => ({
    room: s.room.name,
    startTime: s.startTime,
    endTime: s.endTime,
    duration: s.duration,
  }));

  res.json({
    status: "success",
    workerId: id,
    history: formatted,
  });
};

module.exports = { getWorkersDashboard, getWorkerDetails };
