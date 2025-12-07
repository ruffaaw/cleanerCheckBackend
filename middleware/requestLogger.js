const logger = require("../utils/logger");
const jwt = require("jsonwebtoken");
const { user } = require("../db/models");

module.exports = async (req, res, next) => {
  let userId = null;

  try {
    const idToken = req.cookies?.token;

    if (idToken) {
      const tokenDetail = jwt.verify(idToken, process.env.JWT_SECRET_KEY);
      userId = tokenDetail.id || null;
    }
  } catch (err) {
    // brak błędów – logger nie powinien blokować requesta
  }

  const logEntry = {
    type: "REQUEST",
    userId,
    ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.headers["user-agent"],
  };

  logger.info(logEntry);
  next();
};
