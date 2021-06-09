const jwt = require("jsonwebtoken");
const { ENV } = require("../resources/constants");
const constants = require("../resources/constants");

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    // console.log(token);
    const decoded = jwt.verify(token, ENV.JWT_KEY);

    // check if the user is an admin - if admin user consumable APIs are restricted
    if (decoded.roles?.includes(constants.ROLE.ADMIN))
      return res.status(401).json({message: 'User authorization failed'});

    req.userData = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Auth failed!",
      error
    });
  }
};
