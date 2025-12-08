const { user } = require("../db/models");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const signup = catchAsync(async (req, res, next) => {
  const body = req.body;

  const newUser = await user.create({
    name: body.name,
    password: body.password,
    confirmPassword: body.confirmPassword,
  });

  if (!newUser) {
    return next(new AppError("Failed to create user", 400));
  }

  const result = newUser.toJSON();

  delete result.password;

  result.token = generateToken({
    id: result.id,
  });

  return res.status(201).json({
    status: "success",
    message: "User created successfully",
    data: result,
  });
});

const login = catchAsync(async (req, res, next) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return next(new AppError("Name and password are required", 400));
  }

  const result = await user.findOne({ where: { name } });

  if (!result || !(await bcrypt.compare(password, result.password))) {
    return next(new AppError("Invalid name or password", 401));
  }

  const token = generateToken({ id: result.id });

  res.cookie("token", token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
    path: "/",
  });

  return res.json({
    status: "success",
    token,
    resetPassword: result.resetPassword,
  });
});

const getAllUsers = catchAsync(async (req, res, next) => {
  const users = await user.findAll({
    attributes: { exclude: ["password"] },
  });

  return res.status(200).json({
    status: "success",
    data: users,
  });
});

const updateUser = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const body = req.body;

  const foundUser = await user.findByPk(userId);
  if (!foundUser) {
    return next(new AppError("User not found", 404));
  }
  foundUser.name = body.name || foundUser.name;

  const updatedUser = await foundUser.save();

  return res.status(200).json({
    status: "success",
    data: updatedUser,
  });
});

const deleteUser = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  const foundUser = await user.findByPk(userId);

  if (!foundUser) {
    return next(new AppError("User not found", 404));
  }

  await foundUser.destroy();

  return res.status(200).json({
    status: "success",
    message: "User deleted successfully",
  });
});

const authentication = catchAsync(async (req, res, next) => {
  //1. get the token from headers
  const idToken = req.cookies?.token;

  if (!idToken) {
    return next(new AppError("please lognin to get access"));
  }

  //2. token varification
  const tokenDetail = jwt.verify(idToken, process.env.JWT_SECRET_KEY);
  //3. get the user detail from db and add to req object

  const freshUser = await user.findByPk(tokenDetail.id);

  if (!freshUser) {
    return next(new AppError("User no longer exists", 400));
  }
  req.user = freshUser;
  return next();
});

const restrictTo = (...userType) => {
  const checkPermission = (req, res, next) => {
    if (!userType.includes(req.user.userType)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }
    return next();
  };

  return checkPermission;
};

const logout = (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    expires: new Date(0),
    path: "/",
  });

  return res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  });
};

const whoAmI = catchAsync(async (req, res, next) => {
  if (!req.user) {
    return next(new AppError("User not authenticated", 401));
  }

  return res.status(200).json({
    status: "success",
    data: {
      name: req.user.name,
    },
  });
});

const changePassword = catchAsync(async (req, res, next) => {
  const { newPassword, confirmPassword } = req.body;
  const userId = req.user.id;
  const found = await user.findByPk(userId);

  if (!found.resetPassword)
    return next(new AppError("Password change not required", 400));

  found.password = newPassword;
  found.confirmPassword = confirmPassword;
  found.resetPassword = false;

  await found.save();

  return res.json({
    status: "success",
    message: "Hasło zostało zmienione",
  });
});

const forcePasswordReset = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const { newPassword, confirmPassword } = req.body;

  const found = await user.findByPk(userId);
  if (!found) return next(new AppError("User not found", 404));

  found.password = newPassword;
  found.confirmPassword = confirmPassword;
  found.resetPassword = true;
  await found.save();

  res.json({
    status: "success",
    message: "Password reset forced",
  });
});

module.exports = {
  signup,
  login,
  authentication,
  restrictTo,
  logout,
  whoAmI,
  changePassword,
  forcePasswordReset,
  getAllUsers,
  updateUser,
  deleteUser,
};
