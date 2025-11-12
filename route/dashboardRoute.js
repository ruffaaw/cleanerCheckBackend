const express = require("express");
const router = express.Router();
const dash = require("../controller/dashboardController");
const { authentication } = require("../controller/authController");

router.route("/workers").get(authentication, dash.getWorkersDashboard);
router.route("/workers/:id").get(authentication, dash.getWorkerDetails);

router.route("/rooms").get(authentication, dash.getRoomsDashboard);
router.route("/rooms/:id").get(authentication, dash.getRoomDetails);

module.exports = router;
