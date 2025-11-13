const {
  signup,
  login,
  logout,
  whoAmI,
} = require("../controller/authController");
const { authentication } = require("../controller/authController");

const router = require("express").Router();

router.route("/signup").post(signup);

router.route("/login").post(login);

router.route("/logout").get(logout);

router.route("/whoami").get(authentication, whoAmI);

module.exports = router;
