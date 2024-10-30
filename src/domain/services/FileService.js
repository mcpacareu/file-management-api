const ActivityLog = require("../models/ActivityLog");
const path = require("path");
const { encryptFile, decryptFile } = require("../../utils/encryption");
const fs = require("fs");
const crypto = require("crypto");
const uuid = require("uuid");
const AppError = require("../../utils/AppError");

const basePath = path.join(__dirname, "../../..", "storage");
const encryptedDir =
  process.env.ENCRYPTED_DIR || path.join(basePath, "encrypted");
const decryptedDir =
  process.env.DECRYPTED_DIR || path.join(basePath, "decrypted");

class FileService {
  constructor(fileRepository) {
    this.fileRepository = fileRepository;
  }

  async uploadFile(fileData) {
    const file = await this.fileRepository.create(fileData);
    await ActivityLog.create({ user: fileData.user, action: "upload" });
    return file;
  }

  async getFileById(id) {
    const file = await this.fileRepository.findById(id);
    if (!file) {
      throw new AppError("File not found", 404);
    }
    await ActivityLog.create({ user: file.user, action: "findById" });
    return file;
  }

  async getUserFiles(userId) {
    const files = await this.fileRepository.findByUserId(userId);
    await ActivityLog.create({ user: userId, action: "list" });
    return files;
  }
  async encryptAndSaveFile(tempFilePath, userId, filename, fileSize) {
    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);

    if (!fs.existsSync(encryptedDir)) {
      fs.mkdirSync(encryptedDir);
    }

    const encryptedFilePath = path.join(encryptedDir, filename);
    await encryptFile(tempFilePath, encryptedFilePath, key, iv);

    const fileData = {
      filename,
      user: userId,
      fileSize,
      filePath: encryptedFilePath,
      encryptionKey: key.toString("hex"),
      iv: iv.toString("hex"),
    };

    const savedFile = await this.fileRepository.create(fileData);
    await ActivityLog.create({ user: userId, action: "upload" });

    return savedFile;
  }

  async decryptFileToTemp(file) {
    if (!fs.existsSync(decryptedDir)) {
      fs.mkdirSync(decryptedDir);
    }

    const decryptedFilePath = path.join(
      decryptedDir,
      `${uuid.v4()}_${file.filename}`
    );
    await decryptFile(
      file.filePath,
      decryptedFilePath,
      file.encryptionKey,
      file.iv
    );

    return decryptedFilePath;
  }

  async deleteFile(id) {
    const file = await this.fileRepository.deleteById(id);
    if (!file) {
      throw new Error("File not found");
    }
    await ActivityLog.create({ user: file.user, action: "delete" });
    return file;
  }
}

module.exports = FileService;
