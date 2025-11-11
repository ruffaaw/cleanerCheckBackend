const express = require("express");
const router = express.Router();
const dash = require("../controller/dashboardController");

router.get("/workers", dash.getWorkersDashboard);
router.get("/workers/:id", dash.getWorkerDetails);

module.exports = router;
