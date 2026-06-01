const router = require("express").Router();
const authController = require("./auth.controller");
const { authenticate } = require("../../middlewares/auth.middleware");

router.post("/login", authController.login);
router.post("/register", authController.register);
router.get("/me", authenticate, authController.me);
router.post("/verify-password", authenticate, authController.verifyPassword);
router.post("/change-password", authenticate, authController.changePassword);

module.exports = router;
