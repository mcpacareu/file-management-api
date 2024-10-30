const express = require("express");
const UserRepository = require("../../infrastructure/persistence/UserRepository");
const FileRepository = require("../../infrastructure/persistence/FileRepository");
const UserService = require("../../domain/services/UserService");
const UserController = require("../controllers/UserController");
const UserModel = require("../../domain/models/User");
const FileModel = require("../../domain/models/File");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();
const userRepository = new UserRepository(UserModel);
const fileRepository = new FileRepository(FileModel);
const userService = new UserService(userRepository, fileRepository);
const userController = new UserController(userService);

router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);
router.get("/export-data", authMiddleware, userController.exportUserData);
router.get("/:id", authMiddleware, userController.findUserById);
router.delete(
  "/delete-account",
  authMiddleware,
  userController.deleteUserAndFiles
);
router.delete("/:id", authMiddleware, userController.deleteUserById);


module.exports = router;
