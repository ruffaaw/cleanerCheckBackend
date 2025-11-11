const { cleaningSession } = require("../db/models");
const { DateTime } = require("luxon");
const catchAsync = require("../utils/catchAsync");
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
  const activeSession = await cleaningSession.findOne({
    where: { workerId, roomId, endTime: null },
  });

  if (activeSession) {
    // zakończ sprzątanie
    activeSession.endTime = new Date();
    const durationMinutes = Math.round(
      (activeSession.endTime - activeSession.startTime) / 1000 / 60
    );

    activeSession.duration = durationMinutes;
    await activeSession.save();

    const data = {
      id: activeSession.id,
      workerId: activeSession.workerId,
      roomId: activeSession.roomId,
      startTime: formatWarsawTime(activeSession.startTime),
      endTime: formatWarsawTime(activeSession.endTime),
      durationMinutes: activeSession.duration,
    };

    return res.status(200).json({
      status: "success",
      message: "cleaning finished",
      data,
    });
  } else {
    // sprawdzenie czy pracownik nie ma żadnego aktywnego sprzątania w innym pomieszczeniu
    const existing = await cleaningSession.findOne({
      where: { workerId, endTime: null },
    });

    if (existing && !activeSession) {
      return next(
        new AppError(
          "Najpierw musisz dokończyć pracę w poprzednim pomieszczeniu.",
          400
        )
      );
    }

    // rozpocznij nowe sprzątanie
    const newSession = await cleaningSession.create({
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
