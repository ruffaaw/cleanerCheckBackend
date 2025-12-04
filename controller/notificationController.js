const { notifications } = require("../db/models");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { DateTime } = require("luxon");

const formatWarsawTime = (date) =>
  date
    ? DateTime.fromJSDate(new Date(date))
        .setZone("Europe/Warsaw")
        .toFormat("dd-MM-yyyy HH:mm:ss")
    : null;

const createNotification = catchAsync(async (req, res, next) => {
  const body = req.body;

  const newNotification = await notifications.create({
    userId: body.userId,
    title: body.title,
    message: body.message,
    isRead: false,
  });

  return res.status(201).json({
    status: "success",
    message: "Powiadomienie utworzone pomyślnie",
    data: newNotification,
  });
});

const getAllNotifications = catchAsync(async (req, res, next) => {
  const result = await notifications.findAll({ order: [["date", "DESC"]] });

  const formatted = result.map((n) => ({
    ...n.toJSON(),
    date: formatWarsawTime(n.date),
  }));

  return res.status(200).json({
    status: "success",
    data: formatted,
  });
});

const getAllUserNotifications = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const result = await notifications.findAll({
    where: { userId },
    order: [["date", "DESC"]],
  });

  const formatted = result.map((n) => ({
    ...n.toJSON(),
    date: formatWarsawTime(n.date),
  }));

  return res.status(200).json({
    status: "success",
    data: formatted,
  });
});

const getUnreadNotifications = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  const result = await notifications.findAll({
    where: { userId, isRead: false },
    order: [["date", "DESC"]],
  });

  const formatted = result.map((n) => ({
    ...n.toJSON(),
    date: formatWarsawTime(n.date),
  }));

  return res.status(200).json({
    status: "success",
    data: formatted,
  });
});

const getReadNotifications = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  const result = await notifications.findAll({
    where: { userId, isRead: true },
    order: [["date", "DESC"]],
  });

  const formatted = result.map((n) => ({
    ...n.toJSON(),
    date: formatWarsawTime(n.date),
  }));

  return res.status(200).json({
    status: "success",
    data: formatted,
  });
});

const getUnreadCountNotications = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const count = await notifications.count({ where: { userId, isRead: false } });

  return res.status(200).json({
    status: "success",
    unreadCount: count,
  });
});

const markNotificationAsRead = catchAsync(async (req, res, next) => {
  const notificationId = req.params.id;
  const userId = req.user.id;

  const notification = await notifications.findByPk(notificationId);

  if (!notification) {
    return next(new AppError("Nie znaleziono powiadomienia", 404));
  } else if (notification.userId !== userId) {
    return next(new AppError("Brak dostępu do tego powiadomienia", 403));
  }

  notification.isRead = true;
  await notification.save();

  return res.status(200).json({
    status: "success",
    message: "Oznaczono powiadomienie jako przeczytane",
    data: notification,
  });
});

const markNotificationsAsRead = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  await notifications.update(
    { isRead: true },
    { where: { userId, isRead: false } }
  );

  return res.status(200).json({
    status: "success",
    message: "Oznaczono wszystkie powiadomienia jako przeczytane",
  });
});

const updateNotification = catchAsync(async (req, res, next) => {
  const { id, userId, title, message, date, isRead } = req.body;

  const notification = await notifications.findByPk(id);

  if (!notification) {
    return next(new AppError("Nie znaleziono powiadomienia", 404));
  }

  notification.userId = userId || notification.userId;
  notification.title = title || notification.title;
  notification.message = message || notification.message;
  notification.date = date || notification.date;
  notification.isRead = isRead !== undefined ? isRead : notification.isRead;
  await notification.save();

  return res.status(200).json({
    status: "success",
    message: "Powiadomienie zaktualizowane pomyślnie",
    data: notification,
  });
});

const deleteNotification = catchAsync(async (req, res, next) => {
  const notificationId = req.params.id;
  const notification = await notifications.findByPk(notificationId);

  if (!notification) {
    return next(new AppError("Nie znaleziono powiadomienia", 404));
  }

  await notification.destroy();

  return res.status(200).json({
    status: "success",
    message: "Powiadomienie usunięte pomyślnie",
  });
});

module.exports = {
  createNotification,
  getAllNotifications,
  getAllUserNotifications,
  getUnreadNotifications,
  getReadNotifications,
  getUnreadCountNotications,
  markNotificationAsRead,
  markNotificationsAsRead,
  updateNotification,
  deleteNotification,
};
