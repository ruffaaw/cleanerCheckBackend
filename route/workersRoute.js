const {
  createWorker,
  getAllWorkers,
  getWorkerById,
  updateWorker,
  deleteWorker,
} = require("../controller/workersController");
const { authentication } = require("../controller/authController");

const router = require("express").Router();

router
  .route("/")
  .post(authentication, createWorker)
  .get(authentication, getAllWorkers);

router
  .route("/:id")
  .get(authentication, getWorkerById)
  .patch(authentication, updateWorker)
  .delete(authentication, deleteWorker);

module.exports = router;
