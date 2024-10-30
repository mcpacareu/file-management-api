require('dotenv').config();
const jwt = require("jsonwebtoken");
const process = require("process");

function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Invalid token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(400).json({ message: "Invalid token" });
  }
}

module.exports = auth;
