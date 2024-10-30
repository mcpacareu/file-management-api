const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const AppError = require("../../utils/AppError");
const UserMapper = require("../mappers/UserMapper");
const process = require("process");
const archiver = require("archiver");
const uuid = require("uuid");
const path = require("path");
const { decryptFile } = require("../../utils/encryption");
const fs = require("fs");
const ActivityLog = require("../models/ActivityLog");

const basePath = path.join(__dirname, "../../..", "storage");
const tempDecryptedDir =
  process.env.TEMP_DECRYPTED_DIR || path.join(basePath, "temp_decrypted");

class UserService {
  constructor(userRepository, fileRepository) {
    this.userRepository = userRepository;
    this.fileRepository = fileRepository;
  }

  async registerUser(userDto) {
    const existingEmail = await this.userRepository.findByEmail(userDto.email);
    if (existingEmail) {
      throw new AppError("Email already in use", 409);
    }

    const existingUsername = await this.userRepository.findByUsername(
      userDto.username
    );
    if (existingUsername) {
      throw new AppError("Username already in use", 409);
    }

    const hashedPassword = await bcrypt.hash(userDto.password.trim(), 10);

    const userEntity = UserMapper.toEntity({
      ...userDto,
      password: hashedPassword,
    });
    const savedUser = await this.userRepository.create(userEntity);

    return UserMapper.toDTO(savedUser);
  }

  async loginUser({ email, password }) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const isPasswordValid = await bcrypt.compare(
      password.trim(),
      user.password
    );
    if (!isPasswordValid) {
      throw new AppError("Invalid credentials", 401);
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    return token;
  }

  async findById(userId) {
    try {
      const user = await this.userRepository.findById(userId);

      if (!user) {
        throw new AppError("User not found", 404);
      }

      return user;
    } catch (error) {
      throw new AppError(
        error.message || "User retrieval error",
        error.statusCode || 500
      );
    }
  }

  async deleteById(userId) {
    try {
      const deletedUser = await this.userRepository.deleteById(userId);

      if (!deletedUser) {
        throw new AppError("User not found", 404);
      }

      return { message: "User deleted successfully" };
    } catch (error) {
      throw new AppError(
        error.message || "Error deleting user",
        error.statusCode || 500
      );
    }
  }

  async deleteUserAndFiles(userId) {
    try {
      const deletedUser = await this.userRepository.deleteById(userId);
      if (!deletedUser) {
        throw new AppError("User not found", 404);
      }

      await this.fileRepository.deleteFilesByUser(userId);

      return { message: "User and associated files deleted successfully" };
    } catch (error) {
      throw new AppError(
        error.message || "Error deleting user and files",
        error.statusCode || 500
      );
    }
  }

  async exportUserData(userId) {
    const userFiles = await this.fileRepository.findByUserId(userId);
    const archive = archiver("zip", { zlib: { level: 9 } });

    if (!fs.existsSync(tempDecryptedDir)) {
      fs.mkdirSync(tempDecryptedDir, { recursive: true });
    }

    const tempDecryptedFiles = [];

    for (const file of userFiles) {
      const decryptedFilePath = path.join(
        __dirname,
        "../../../decrypted",
        `${uuid.v4()}_${file.filename}`
      );

      await decryptFile(
        file.filePath,
        decryptedFilePath,
        file.encryptionKey,
        file.iv
      );
      tempDecryptedFiles.push(decryptedFilePath);

      archive.file(decryptedFilePath, { name: file.filename });
    }

    await ActivityLog.create({ user: userId, action: "export" });

    archive.finalize();

    archive.on("end", () => {
      tempDecryptedFiles.forEach((filePath) => {
        fs.unlink(filePath, (err) => {
          if (err)
            console.error(`Error removing temporary decrypted file: ${err}`);
        });
      });
    });

    return archive;
  }
}

module.exports = UserService;
