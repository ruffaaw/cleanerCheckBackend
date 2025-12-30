const { workers, cleaningSession, rooms } = require("../db/models");
const { DateTime } = require("luxon");
const catchAsync = require("../utils/catchAsync");
const { Op } = require("sequelize");
const { activeStatusByType, finishedStatusByType } = require("../utils/status");

const formatTime = (date) =>
  date ? DateTime.fromJSDate(date).setZone("Europe/Warsaw").toRelative() : null;

const getWorkersDashboard = catchAsync(async (req, res, next) => {
  // PAGINACJA
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  // WYSZUKIWANIE
  const search = req.query.search || "";

  // SORTOWANIE
  const sortBy = req.query.sortBy || "name";
  const sortOrder = req.query.sortOrder === "ASC" ? "ASC" : "DESC";

  let order = [];

  switch (sortBy) {
    case "currentRoom":
      order = [
        [{ model: cleaningSession }, { model: rooms }, "name", sortOrder],
      ];
      break;

    case "isCleaning":
      // sortowanie: sprzątający najpierw / albo odwrotnie
      order = [[Sequelize.literal(`"cleaningSessions"."id"`), sortOrder]];
      break;

    case "name":
    default:
      order = [["name", sortOrder]];
      break;
  }

  // Pobieramy listę pracowników
  const { rows: workersList, count: total } = await workers.findAndCountAll({
    attributes: ["id", "name", "workerType"],
    where: search
      ? {
          name: { [Op.iLike]: `%${search}%` },
        }
      : undefined,
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
    limit,
    offset,
    order,
  });

  const formatted = workersList.map((worker) => {
    const activeSession = worker.cleaningSessions?.[0] || null;
    const workerType = worker.workerType;

    let status;

    if (activeSession) {
      status = activeStatusByType[workerType] || "W trakcie pracy";
    } else {
      status = finishedStatusByType[workerType] || "Dostępny";
    }

    return {
      id: worker.id,
      name: worker.name,
      workerType,
      status,
      isActive: !!activeSession,
      currentRoom: activeSession?.room?.name || null,
    };
  });

  res.json({
    status: "success",
    data: formatted,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
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
    attributes: ["id", "name", "workerType"],
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
            name: { [Op.iLike]: `%${search}%` },
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

  const workerType = workerData.workerType;

  let status;

  const activeSession = await cleaningSession.findOne({
    where: { workerId: id, endTime: null },
    include: [{ model: rooms, attributes: ["name"] }],
  });

  if (activeSession) {
    status = activeStatusByType[workerType] || "W trakcie pracy";
  } else {
    status = finishedStatusByType[workerType] || "Dostępny";
  }

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
    isActive: !!activeSession,
    currentRoom: activeSession?.room?.name || null,
    status,
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
  // PAGINACJA
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  // WYSZUKIWANIE
  const search = req.query.search || "";

  // SORTOWANIE
  const sortBy = req.query.sortBy || "name";
  const sortOrder = req.query.sortOrder === "ASC" ? "ASC" : "DESC";

  const allRooms = await rooms.findAll({
    where: search ? { name: { [Op.iLike]: `%${search}%` } } : undefined,
    include: [
      // aktywna sesja sprzątania
      {
        model: cleaningSession,
        required: false,
        where: { endTime: null },
        include: [{ model: workers, attributes: ["name", "workerType"] }],
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
        include: [{ model: workers, attributes: ["name", "workerType"] }],
      },
    ],
  });

  // FORMATOWANIE
  let formatted = allRooms.map((room) => {
    const active = room.cleaningSessions?.[0] || null;
    const last = room.lastSession?.[0] || null;

    const workerType =
      active?.worker?.workerType ?? last?.worker?.workerType ?? null;

    let status;

    if (active) {
      status = activeStatusByType[workerType] || "W trakcie";
    } else if (last) {
      status = finishedStatusByType[workerType] || "Ukończone";
    } else {
      status = "Brak aktywności";
    }

    const worker = active?.worker?.name || last?.worker?.name || null;

    return {
      id: room.id,
      name: room.name,
      status,
      isActive: !!active,
      worker,
      workerType,
      cleaningSince: active ? formatTime(active.startTime) : null,
      lastCleaning: last?.endTime ? new Date(last.endTime) : null,
      lastCleaningText:
        last && last.endTime
          ? `${last.worker?.name || "—"}, ${formatTime(last.endTime)}`
          : null,
    };
  });

  // SORTOWANIE PO PRZETWORZENIU
  formatted.sort((a, b) => {
    let v1, v2;

    switch (sortBy) {
      case "status":
        v1 = a.status || "";
        v2 = b.status || "";
        break;

      case "worker":
        v1 = a.worker || "";
        v2 = b.worker || "";
        break;

      case "cleaningSince":
        v1 = a.cleaningSince ? new Date(a.cleaningSince).getTime() : 0;
        v2 = b.cleaningSince ? new Date(b.cleaningSince).getTime() : 0;
        break;

      case "lastCleaning":
        v2 = a.lastCleaning ? new Date(a.lastCleaning).getTime() : 0;
        v1 = b.lastCleaning ? new Date(b.lastCleaning).getTime() : 0;
        break;

      case "name":
      default:
        v1 = a.name.toLowerCase();
        v2 = b.name.toLowerCase();
        break;
    }

    if (v1 < v2) return sortOrder === "ASC" ? -1 : 1;
    if (v1 > v2) return sortOrder === "ASC" ? 1 : -1;
    return 0;
  });

  // PAGINACJA NA FORMATOWANYCH DANYCH
  const paginated = formatted.slice(offset, offset + limit);

  res.json({
    status: "success",
    data: paginated,
    pagination: {
      page,
      limit,
      total: formatted.length,
      totalPages: Math.ceil(formatted.length / limit),
    },
  });
});

const getRoomDetails = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // PAGINACJA
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  // WYSZUKIWANIE
  const search = req.query.search || ""; // wyszukiwanie po nazwie pracownika

  // FILTROWANIE PO DATAH
  const startDate = req.query.startDate || null;
  const endDate = req.query.endDate || null;

  let start = startDate ? new Date(startDate) : null;
  let end = endDate ? new Date(endDate) : null;

  if (start) start.setHours(0, 0, 0, 0);
  if (end) end.setHours(23, 59, 59, 999);

  // SORTOWANIE
  const sortBy = req.query.sortBy || "startTime";
  const sortOrder = req.query.sortOrder === "ASC" ? "ASC" : "DESC";

  let order = [];

  switch (sortBy) {
    case "worker":
      order = [[{ model: workers }, "name", sortOrder]];
      break;

    case "endTime":
      order = [["endTime", sortOrder]];
      break;

    case "duration":
      order = [["duration", sortOrder]];
      break;

    case "startTime":
    default:
      order = [["startTime", sortOrder]];
      break;
  }

  // FILTRY
  const where = { roomId: id };

  if (start && end) {
    where.startTime = { [Op.between]: [start, end] };
  } else if (start) {
    where.startTime = { [Op.gte]: start };
  } else if (end) {
    where.startTime = { [Op.lte]: end };
  }

  // HISTORIA (WSTRZYKNIĘTA PAGINACJA / SORTOWANIE / SEARCH)
  const { rows: sessions, count: total } =
    await cleaningSession.findAndCountAll({
      where,
      include: [
        {
          model: workers,
          attributes: ["name", "workerType"],
          where: search ? { name: { [Op.iLike]: `%${search}%` } } : undefined,
        },
      ],
      order,
      limit,
      offset,
    });

  // AKTYWNA SESJA
  const activeSession = await cleaningSession.findOne({
    where: { roomId: id, endTime: null },
    include: [{ model: workers, attributes: ["name", "workerType"] }],
  });

  // OSTATNIA UKOŃCZONA SESJA
  const lastSession = await cleaningSession.findOne({
    where: {
      roomId: id,
      endTime: { [Op.ne]: null },
    },
    include: [{ model: workers, attributes: ["name", "workerType"] }],
    order: [["endTime", "DESC"]],
  });

  // FORMAT HISTORII
  const formattedHistory = sessions.map((s) => ({
    worker: s.worker?.name || null,
    startTime: s.startTime,
    endTime: s.endTime,
    duration: s.duration,
  }));

  // STATUS
  const workerType =
    activeSession?.worker?.workerType ??
    lastSession?.worker?.workerType ??
    null;

  let status;

  if (activeSession) {
    status = activeStatusByType[workerType] || "W trakcie";
  } else if (lastSession) {
    status = finishedStatusByType[workerType] || "Ukończone";
  } else {
    status = "Brak aktywności";
  }

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
    status,
    isActive: !!activeSession,
    cleaningSince,
    lastCleaning,
    history: formattedHistory,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

module.exports = {
  getWorkersDashboard,
  getWorkerDetails,
  getRoomsDashboard,
  getRoomDetails,
};
