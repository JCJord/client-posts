const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    let token = req.headers.authorization.split(" ")[1];
    jwt.verify(token, "test_page_now");
    next();
  } catch (err) {
    res.status(401).json({ message: err });
  }
};