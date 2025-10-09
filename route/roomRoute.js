const {
  createRoom,
  getAllRoom,
  getRoomById,
  updateRoom,
  deleteRoom,
} = require("../controller/roomController");
const { authentication } = require("../controller/authController");

const router = require("express").Router();

router
  .route("/")
  .post(authentication, createRoom)
  .get(authentication, getAllRoom);

router
  .route("/:id")
  .get(authentication, getRoomById)
  .patch(authentication, updateRoom)
  .delete(authentication, deleteRoom);

module.exports = router;
