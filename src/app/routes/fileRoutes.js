const express = require("express");
const multer = require("multer");
const FileRepository = require("../../infrastructure/persistence/FileRepository");
const FileService = require("../../domain/services/FileService");
const FileController = require("../controllers/FileController");
const FileModel = require("../../domain/models/File");
const authMiddleware = require("../middlewares/authMiddleware");
const uploadMiddleware = require("../middlewares/uploadMiddleware");

const router = express.Router();
const fileRepository = new FileRepository(FileModel);
const fileService = new FileService(fileRepository);
const fileController = new FileController(fileService);

router.post("/upload", authMiddleware, (req, res, next) => {
  uploadMiddleware.single("file")(req, res, (err) => {
    if (
      err instanceof multer.MulterError &&
      err.code === "LIMIT_UNEXPECTED_FILE"
    ) {
      return res.status(400).json({
        message: "Only one file is allowed per request.",
      });
    } else if (err) {
      return res
        .status(500)
        .json({ message: "File upload error", error: err.message });
    }
    fileController.uploadFile(req, res, next);
  });
});
router.get("/download/:id", authMiddleware, fileController.downloadFile);
router.get("/", authMiddleware, fileController.getFiles);
router.delete("/:id", authMiddleware, fileController.deleteFile);

module.exports = router;
