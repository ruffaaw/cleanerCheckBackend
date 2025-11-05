const user = require("../db/models/user");
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
    secure: process.env.NODE_ENV === "development",
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000,
    path: "/",
  });

  return res.json({
    status: "success",
    token,
  });
});

const authentication = catchAsync(async (req, res, next) => {
  //1. get the token from headers
  let idToken = "";
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    //Bearer fhasdkfjands
    idToken = req.headers.authorization.split(" ")[1];
  }

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

module.exports = { signup, login, authentication, restrictTo };
