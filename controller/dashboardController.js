const { workers, cleaningSession, rooms } = require("../db/models");
const { DateTime } = require("luxon");
const catchAsync = require("../utils/catchAsync");
const { Op } = require("sequelize");

const formatTime = (date) =>
  date ? DateTime.fromJSDate(date).setZone("Europe/Warsaw").toRelative() : null;

const getWorkersDashboard = catchAsync(async (req, res, next) => {
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
});

const getWorkerDetails = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const search = req.query.search || "";
  const startDate = req.query.startDate || null;
  const endDate = req.query.endDate || null;

  const sortBy = req.query.sortBy || "startTime";
  const sortOrder = req.query.sortOrder === "ASC" ? "ASC" : "DESC";

  let order = [];

  switch (sortBy) {
    case "name":
      order = [[{ model: rooms }, "name", sortOrder]];
      break;

    case "endTime":
      order = [["endTime", sortOrder]];
      break;

    case "startTime":
    default:
      order = [["startTime", sortOrder]];
      break;
  }

  const workerData = await workers.findByPk(id, {
    attributes: ["id", "name"],
  });

  if (!workerData) {
    return next(new AppError("Worker not found", 404));
  }

  let start = startDate ? new Date(startDate) : null;
  let end = endDate ? new Date(endDate) : null;

  if (start) {
    start.setHours(0, 0, 0, 0);
  }
  if (end) {
    end.setHours(23, 59, 59, 999);
  }

  const where = { workerId: id };

  if (start && end) {
    where.startTime = { [Op.between]: [start, end] };
  } else if (start) {
    where.startTime = { [Op.gte]: start };
  } else if (end) {
    where.startTime = { [Op.lte]: end };
  }

  const include = [
    {
      model: rooms,
      attributes: ["name"],
      where: search
        ? {
            name: { [Op.like]: `%${search}%` },
          }
        : undefined,
    },
    {
      model: workers,
      attributes: ["name"],
    },
  ];

  const { rows: sessions, count: total } =
    await cleaningSession.findAndCountAll({
      where,
      include,
      order,
      limit,
      offset,
    });

  const activeSession = await cleaningSession.findOne({
    where: { workerId: id, endTime: null },
    include: [{ model: rooms, attributes: ["name"] }],
  });

  const formatted = sessions.map((s) => ({
    worker: s.worker?.name || null,
    room: s.room?.name || null,
    startTime: s.startTime,
    endTime: s.endTime,
    duration: s.duration,
  }));

  res.json({
    status: "success",
    workerId: workerData.id,
    workerName: workerData.name,
    isCleaning: !!activeSession,
    currentRoom: activeSession?.room?.name || null,
    history: formatted,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

const getRoomsDashboard = catchAsync(async (req, res, next) => {
  const allRooms = await rooms.findAll({
    include: [
      // aktywna sesja sprzątania
      {
        model: cleaningSession,
        required: false,
        where: { endTime: null },
        include: [{ model: workers, attributes: ["name"] }],
      },
      // ostatnia ukończona sesja sprzątania
      {
        model: cleaningSession,
        required: false,
        separate: true,
        limit: 1,
        order: [["endTime", "DESC"]],
        as: "lastSession",
        where: {
          endTime: { [Op.ne]: null },
        },
        include: [{ model: workers, attributes: ["name"] }],
      },
    ],
  });

  const formatted = allRooms.map((room) => {
    const active = room.cleaningSessions?.[0] || null; // aktywna
    const last = room.lastSession?.[0] || null; // ostatnia ukończona

    const status = active
      ? "W trakcie"
      : last
      ? "Posprzątane"
      : "Nigdy nie sprzątane";

    const worker = active?.worker?.name || last?.worker?.name || null;

    return {
      id: room.id,
      name: room.name,
      status,
      worker,
      cleaningSince: active ? formatTime(active.startTime) : null,
      lastCleaning:
        last && last.endTime
          ? `${last.worker?.name || "—"}, ${formatTime(last.endTime)}`
          : null,
    };
  });

  res.json({ status: "success", data: formatted });
});

const getRoomDetails = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const sessions = await cleaningSession.findAll({
    where: { roomId: id },
    include: [{ model: workers, attributes: ["name"] }],
    order: [["startTime", "DESC"]],
  });

  const activeSession = await cleaningSession.findOne({
    where: { roomId: id, endTime: null },
    include: [{ model: workers, attributes: ["name"] }],
  });

  const lastSession = await cleaningSession.findOne({
    where: { roomId: id, endTime: { [Op.ne]: null } },
    include: [{ model: workers, attributes: ["name"] }],
    order: [["endTime", "DESC"]],
  });

  const formattedHistory = sessions.map((s) => ({
    worker: s.worker?.name || null,
    startTime: s.startTime,
    endTime: s.endTime,
    duration: s.duration,
  }));

  const status = activeSession
    ? "W trakcie"
    : lastSession
    ? "Posprzątane"
    : "Nigdy nie sprzątane";

  const cleaningSince = activeSession
    ? formatTime(activeSession.startTime)
    : null;

  const lastCleaning =
    lastSession && lastSession.endTime
      ? `${lastSession.worker?.name || "—"}, ${formatTime(lastSession.endTime)}`
      : null;

  res.json({
    status: "success",
    roomId: id,
    currentStatus: status,
    cleaningSince,
    lastCleaning,
    history: formattedHistory,
  });
});

module.exports = {
  getWorkersDashboard,
  getWorkerDetails,
  getRoomsDashboard,
  getRoomDetails,
};
