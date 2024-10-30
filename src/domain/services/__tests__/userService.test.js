/* eslint-disable no-undef */
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const AppError = require("../../../utils/AppError");
const UserService = require("../UserService");
const { decryptFile } = require("../../../utils/encryption");
const ActivityLog = require("../../models/ActivityLog");
const archiver = require("archiver");

jest.mock("bcryptjs");
jest.mock("jsonwebtoken");

jest.mock("archiver", () =>
  jest.fn().mockReturnValue({
    file: jest.fn(),
    finalize: jest.fn().mockResolvedValue(),
    pipe: jest.fn(),
    on: jest.fn(),
  })
);
jest.mock("../../../utils/encryption", () => ({
  decryptFile: jest.fn(),
}));
jest.mock("fs", () => ({
  createWriteStream: jest.fn(),
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
}));
jest.mock("../../models/ActivityLog", () => ({
  create: jest.fn(),
}));

describe("UserService", () => {
  let userService;
  let userRepository;
  let fileRepository;

  beforeEach(() => {
    userRepository = {
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      deleteById: jest.fn(),
    };

    fileRepository = {
      deleteFilesByUser: jest.fn(),
      findByUserId: jest.fn(),
    };

    userService = new UserService(userRepository, fileRepository);
  });

  describe("registerUser", () => {
    it("should register a new user successfully", async () => {
      const userDto = {
        username: "testuser",
        email: "test@example.com",
        password: "password",
      };
      bcrypt.hash.mockResolvedValue("hashedPassword");
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.findByUsername.mockResolvedValue(null);
      userRepository.create.mockResolvedValue({
        id: 1,
        username: userDto.username,
        email: userDto.email,
      });

      const result = await userService.registerUser(userDto);

      expect(result.username).toBe(userDto.username);
      expect(result.email).toBe(userDto.email);
    });

    it("should throw an error if email is already in use", async () => {
      const userDto = {
        username: "testuser",
        email: "test@example.com",
        password: "password",
      };
      userRepository.findByEmail.mockResolvedValue(true);

      await expect(userService.registerUser(userDto)).rejects.toThrow(AppError);
    });
  });

  describe("loginUser", () => {
    it("should log in the user successfully", async () => {
      const user = {
        email: "test@example.com",
        password: "hashedPassword",
        _id: "user123",
      };
      const credentials = { email: user.email, password: "password" };
      userRepository.findByEmail.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue("token");

      const result = await userService.loginUser(credentials);

      expect(result).toBe("token");
    });

    it("should throw an error if user not found", async () => {
      const credentials = { email: "test@example.com", password: "password" };
      userRepository.findByEmail.mockResolvedValue(null);

      await expect(userService.loginUser(credentials)).rejects.toThrow(
        AppError
      );
    });
  });

  describe("deleteById", () => {
    it("should delete the user successfully", async () => {
      userRepository.deleteById.mockResolvedValue({
        id: 1,
        username: "testuser",
      });

      const result = await userService.deleteById(1);

      expect(result.message).toBe("User deleted successfully");
    });

    it("should throw an error if user is not found", async () => {
      userRepository.deleteById.mockResolvedValue(null);

      await expect(userService.deleteById(1)).rejects.toThrow(AppError);
    });
  });

  describe("deleteUserAndFiles", () => {
    it("should delete user and associated files", async () => {
      userRepository.deleteById.mockResolvedValue({ id: 1 });
      fileRepository.deleteFilesByUser.mockResolvedValue(true);

      const result = await userService.deleteUserAndFiles(1);

      expect(result.message).toBe(
        "User and associated files deleted successfully"
      );
    });

    it("should throw an error if user not found", async () => {
      userRepository.deleteById.mockResolvedValue(null);

      await expect(userService.deleteUserAndFiles(1)).rejects.toThrow(AppError);
    });
  });

  describe("exportUserData", () => {
    it("should export user data and return an archive stream", async () => {
      const userId = "mockUserId";

      const userFiles = [
        {
          filePath: "encrypted/path/file1.txt",
          filename: "file1.txt",
          encryptionKey:
            "77a46f55998abad2c11d330fe39a264d3ab6ad0119ead3cbd2b9e81e1f3282d0", // Valor hexadecimal
          iv: "cedb3e36d2d1d931837a822d0996fe17",
        },
        {
          filePath: "encrypted/path/file2.txt",
          filename: "file2.txt",
          encryptionKey:
            "99a46f55398abad2c11d330fe39a264d3ab6ad0119ead3cbd2b9e81e1f3282d1", // Otro valor hexadecimal
          iv: "def3e36d2d1d931837a822d0996fe17",
        },
      ];

      const fileRepository = {
        findByUserId: jest.fn().mockResolvedValue(userFiles),
      };

      const userService = new UserService(userRepository, fileRepository);

      const archive = await userService.exportUserData(userId);

      for (const file of userFiles) {
        expect(decryptFile).toHaveBeenCalledWith(
          file.filePath,
          expect.any(String),
          file.encryptionKey,
          file.iv
        );
      }

      expect(ActivityLog.create).toHaveBeenCalledWith({
        user: userId,
        action: "export",
      });

      for (const file of userFiles) {
        expect(archiver().file).toHaveBeenCalledWith(expect.any(String), {
          name: file.filename,
        });
      }

      expect(archive).toBeDefined();
    });
  });
});
