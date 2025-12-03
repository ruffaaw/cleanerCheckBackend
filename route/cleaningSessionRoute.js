const {
  handleQrScan,
  createManualSession,
} = require("../controller/cleaningSessionController");

const router = require("express").Router();

router.route("/").post(handleQrScan);
router.route("/manual").post(createManualSession);

module.exports = router;
