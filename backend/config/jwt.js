const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const session = require("express-session");

router.use(
  session({
    secret: "your_session_secret999999",
    resave: false,
    saveUninitialized: true,
  })
);

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to authenticate JWT
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ message: "Invalid token" });
      }
      
      req.user = user; // Attach user to request
      next();
    });
  } else {
    res.status(403).json({ message: "Token is required" });
  }
};

module.exports = { authenticateJWT, router };