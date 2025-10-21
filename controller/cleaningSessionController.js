const { DateTime } = require("luxon");
const catchAsync = require("../utils/catchAsync");
const cleaningSessions = require("../db/models/cleaningSession");
const AppError = require("../utils/appError");

// helper do formatowania dat na strefę Warszawy
const formatWarsawTime = (date) =>
  date
    ? DateTime.fromJSDate(new Date(date))
        .setZone("Europe/Warsaw")
        .toFormat("yyyy-MM-dd HH:mm:ss")
    : null;

const handleQrScan = catchAsync(async (req, res, next) => {
  const { workerId, roomId } = req.body;

  if (!workerId || !roomId) return next(new AppError("Brakujące dane!", 400));

  // sprawdzamy, czy pracownik już sprząta to pomieszczenie
  const activeSession = await cleaningSessions.findOne({
    where: { workerId, roomId, endTime: null },
  });

  if (activeSession) {
    // zakończ sprzątanie
    activeSession.endTime = new Date();
    await activeSession.save();

    const data = {
      id: activeSession.id,
      workerId: activeSession.workerId,
      roomId: activeSession.roomId,
      startTime: formatWarsawTime(activeSession.startTime),
      endTime: formatWarsawTime(activeSession.endTime),
    };

    return res.status(200).json({
      status: "success",
      message: "cleaning finished",
      data,
    });
  } else {
    // rozpocznij nowe sprzątanie
    const newSession = await cleaningSessions.create({
      workerId,
      roomId,
      startTime: new Date(),
      endTime: null,
    });

    const data = {
      id: newSession.id,
      workerId: newSession.workerId,
      roomId: newSession.roomId,
      startTime: formatWarsawTime(newSession.startTime),
    };

    return res.status(201).json({
      status: "success",
      message: "cleaning started",
      data,
    });
  }
});

module.exports = { handleQrScan };
