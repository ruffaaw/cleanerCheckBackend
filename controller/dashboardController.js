const { workers, cleaningSession, rooms } = require("../db/models");
const { DateTime } = require("luxon");

const formatTime = (date) =>
  date ? DateTime.fromJSDate(date).setZone("Europe/Warsaw").toRelative() : null;

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

const getRoomsDashboard = async (req, res) => {
  const allRooms = await rooms.findAll({
    include: [
      {
        model: cleaningSession,
        required: false,
        where: { endTime: null }, // aktywne sesje
        include: [{ model: workers, attributes: ["name"] }],
      },
      {
        model: cleaningSession,
        required: false,
        separate: true,
        limit: 1,
        order: [["endTime", "DESC"]],
        as: "lastSession",
        include: [{ model: workers, attributes: ["name"] }],
      },
    ],
  });

  const formatted = allRooms.map((room) => {
    const active = room.cleaningSessions[0];
    const last = room.lastSession[0];

    return {
      id: room.id,
      name: room.name,
      status: active ? "W trakcie" : last ? "Posprzątane" : "Błąd",
      worker: active?.worker?.name || null,
      cleaningSince: active ? formatTime(active.startTime) : null,
      lastCleaning: last
        ? `${last.worker.name}, ${formatTime(last.endTime)}`
        : null,
    };
  });

  res.json({ status: "success", data: formatted });
};

const getRoomDetails = async (req, res) => {
  const { id } = req.params;

  const sessions = await cleaningSession.findAll({
    where: { roomId: id },
    include: [{ model: workers, attributes: ["name"] }],
    order: [["startTime", "DESC"]],
  });

  const formatted = sessions.map((s) => ({
    worker: s.worker.name,
    startTime: s.startTime,
    endTime: s.endTime,
    duration: s.duration,
  }));

  res.json({
    status: "success",
    roomId: id,
    history: formatted,
  });
};

module.exports = {
  getWorkersDashboard,
  getWorkerDetails,
  getRoomsDashboard,
  getRoomDetails,
};
