const { rooms } = require("../db/models");
const catchAsync = require("../utils/catchAsync");
// const room = require("../db/models/rooms");
const AppError = require("../utils/appError");

const createRoom = catchAsync(async (req, res, next) => {
  const body = req.body;

  const newRoom = await rooms.create({ name: body.name });

  if (!newRoom)
    return next(new AppError("Błąd podczas tworzenia pomieszczenia", 400));

  const result = newRoom.toJSON();

  return res.status(201).json({
    status: "success",
    message: "Room created successfully",
    data: result,
  });
});

const getAllRoom = catchAsync(async (req, res, next) => {
  const result = await rooms.findAll();

  return res.status(200).json({
    status: "success",
    data: result,
  });
});

const getRoomById = catchAsync(async (req, res, next) => {
  const roomId = req.params.id;
  const result = await rooms.findByPk(roomId);

  if (!result)
    return next(new AppError("Nie znaleziono pomieszczenia o tym ID", 404));

  return res.status(200).json({
    status: "success",
    data: result,
  });
});

const updateRoom = catchAsync(async (req, res, next) => {
  const roomId = req.params.id;
  const body = req.body;

  const result = await rooms.findByPk(roomId);

  if (!result)
    return next(new AppError("Nie znaleziono pomieszczenia o tym ID", 404));

  !!body.name ? (result.name = body.name) : result.name;
  !!body.checkIntervalMinutes
    ? (result.checkIntervalMinutes = body.checkIntervalMinutes)
    : result.checkIntervalMinutes;

  const updateRoom = await result.save();

  return res.status(200).json({
    status: "success",
    data: updateRoom,
  });
});

const deleteRoom = catchAsync(async (req, res, next) => {
  const roomId = req.params.id;

  const result = await rooms.findByPk(roomId);

  if (!result)
    return next(new AppError("Nie znaleziono pomieszczenia o tym ID", 404));

  await result.destroy();

  return res.status(200).json({
    status: "success",
    data: "Rekord został pomyślnie usunięty",
  });
});

module.exports = {
  createRoom,
  getAllRoom,
  getRoomById,
  updateRoom,
  deleteRoom,
};
