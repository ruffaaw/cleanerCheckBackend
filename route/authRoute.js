const {
  signup,
  login,
  logout,
  whoAmI,
  changePassword,
  forcePasswordReset,
  restrictTo,
  getAllUsers,
  updateUser,
  deleteUser,
} = require("../controller/authController");
const { authentication } = require("../controller/authController");

const router = require("express").Router();

router.route("/signup").post(signup);

router.route("/login").post(login);

router.route("/logout").get(logout);

router.route("/whoami").get(authentication, whoAmI);

router.route("/changepassword").post(authentication, changePassword);

router.route("/admin/users").get(authentication, restrictTo("1"), getAllUsers);

router
  .route("/admin/updateuser/:userId")
  .put(authentication, restrictTo("1"), updateUser);

router
  .route("/admin/deleteuser/:userId")
  .delete(authentication, restrictTo("1"), deleteUser);

router
  .route("/admin/resetpassword/:userId")
  .post(authentication, restrictTo("1"), forcePasswordReset);

module.exports = router;
