const catchAsync = require("../utils/catchAsync");
const worker = require("../db/models/workers");
const AppError = require("../utils/appError");

const createWorker = catchAsync(async (req, res, next) => {
  const body = req.body;

  const newWorker = await worker.create({
    name: body.name,
  });

  if (!newWorker)
    return next(new AppError("Błąd podczas tworzenia pracownika", 400));

  const result = newWorker.toJSON();

  return res.status(201).json({
    status: "success",
    message: "Worker created successfully",
    data: result,
  });
});

const getAllWorkers = catchAsync(async (req, res, next) => {
  const result = await worker.findAll();

  return res.status(200).json({
    status: "success",
    data: result,
  });
});

const getWorkerById = catchAsync(async (req, res, next) => {
  const workerId = req.params.id;
  const result = await worker.findByPk(workerId);

  if (!result) {
    return next(new AppError("Nie znaleziono pracownika o tym ID", 404));
  }

  return res.status(200).json({
    status: "success",
    data: result,
  });
});

const updateWorker = catchAsync(async (req, res, next) => {
  const workerId = req.params.id;
  const body = req.body;

  const result = await worker.findByPk(workerId);

  if (!result)
    return next(new AppError("Nie znaleziono pracownika o tym ID", 400));

  result.name = body.name;

  const updateWorker = await result.save();

  return res.status(200).json({
    status: "success",
    data: updateWorker,
  });
});

const deleteWorker = catchAsync(async (req, res, next) => {
  const workerId = req.params.id;

  const result = await worker.findByPk(workerId);

  if (!result)
    return next(new AppError("Nie znaleziono pracownika o tym ID", 400));

  await result.destroy();

  return res.status(200).json({
    status: "success",
    data: "Rekord został pomyślnie usunięty",
  });
});

module.exports = {
  createWorker,
  getAllWorkers,
  getWorkerById,
  updateWorker,
  deleteWorker,
};
