const path = require("path");
const fs = require("fs");
const AppError = require("../../utils/AppError");

const basePath = path.join(__dirname, "../../..", "storage");
const uploadsDir = process.env.UPLOADS_DIR || path.join(basePath, "uploads");

class FileController {
  constructor(fileService) {
    this.fileService = fileService;
  }

  uploadFile = async (req, res, next) => {
    try {
      const tempFilePath = path.join(uploadsDir, req.file.filename);
  
      if (!fs.existsSync(tempFilePath)) {
        throw new AppError(`File not found in the temporal path: ${tempFilePath}`, 404);
      }
  
      const savedFile = await this.fileService.encryptAndSaveFile(
        tempFilePath,
        req.user.id,
        req.file.filename,
        req.file.size
      );
  
      fs.unlink(tempFilePath, (err) => {
        if (err) console.error(`Error removing temporal file: ${err}`);
      });
  
      return res.status(201).json(savedFile);
    } catch (error) {
      next(error);
    }
  };

  getFiles = async (req, res, next) => {
    try {
      const files = await this.fileService.getUserFiles(req.user.id);
      return res.status(200).json(files);
    } catch (error) {
      next(error);
    }
  };

  downloadFile = async (req, res, next) => {
    try {
      const file = await this.fileService.getFileById(req.params.id);
  
      if (!file) {
        throw new AppError("File not found", 404);
      }
  
      if (file.user.toString() !== req.user.id.toString()) {
        throw new AppError("Forbidden", 403);
      }
  
      const decryptedFilePath = await this.fileService.decryptFileToTemp(file);
  
      res.download(decryptedFilePath, (err) => {
        if (err) {
          console.error("Error in download:", err);
          next(err);
        } else {
          fs.unlink(decryptedFilePath, (err) => {
            if (err) console.error(`Error removing decrypted file: ${err}`);
          });
        }
      });
    } catch (error) {
      next(error);
    }
  };

  deleteFile = async (req, res, next) => {
    try {
      const file = await this.fileService.getFileById(req.params.id);
      if (file.user.toString() !== req.user.id.toString()) {
        throw new AppError("Forbidden", 403);
      }

      await this.fileService.deleteFile(file.id);
      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = FileController;
