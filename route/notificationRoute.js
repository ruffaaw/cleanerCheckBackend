const {
  createNotification,
  getAllNotifications,
  getAllUserNotifications,
  getUnreadNotifications,
  getReadNotifications,
  markNotificationAsRead,
  markNotificationsAsRead,
  updateNotification,
  deleteNotification,
  getUnreadCountNotications,
} = require("../controller/notificationController");
const { authentication, restrictTo } = require("../controller/authController");

const router = require("express").Router();

router
  .route("/")
  .post(authentication, createNotification)
  .put(authentication, markNotificationsAsRead);

router.route("/user").get(authentication, getAllUserNotifications);
router.route("/user/read").get(authentication, getReadNotifications);
router.route("/user/unread").get(authentication, getUnreadNotifications);
router
  .route("/user/unread/count")
  .get(authentication, getUnreadCountNotications);

router.route("/:id").put(authentication, markNotificationAsRead);

router
  .route("/admin/getAll")
  .get(authentication, restrictTo("1"), getAllNotifications);

router
  .route("/admin/update")
  .put(authentication, restrictTo("1"), updateNotification);

router
  .route("/admin/delete/:id")
  .delete(authentication, restrictTo("1"), deleteNotification);

module.exports = router;
