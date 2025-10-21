const { handleQrScan } = require("../controller/cleaningSessionController");

const router = require("express").Router();

router.route("/").post(handleQrScan);

module.exports = router;
