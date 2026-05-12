const express = require("express");
const router = express.Router();

const controller = require("../controllers/authController");
const authMiddleware = require("../middleware/auth");

router.post("/register", controller.register);
router.post("/login", controller.login);

// Protected route demo
router.get("/user", authMiddleware, (req, res) => {
  res.json({
    message: "This is a protected route",
    user: req.user
  });
});

module.exports = router;