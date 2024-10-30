/* eslint-disable no-undef */
const UserController = require("../UserController");
const UserService = require("../../../domain/services/UserService");
const CreateUserDTO = require("../../../domain/dtos/CreateUserDTO");

jest.mock("../../../domain/services/UserService");
jest.mock("express-validator", () => {
  const actual = jest.requireActual("express-validator");
  return {
    ...actual,
    body: jest.fn(() => ({
      isLength: jest.fn().mockReturnThis(),
      withMessage: jest.fn().mockReturnThis(),
      matches: jest.fn().mockReturnThis(),
      bail: jest.fn().mockReturnThis(),
      isEmail: jest.fn().mockReturnThis(),
      notEmpty: jest.fn().mockReturnThis(),  
    })),
    validationResult: jest.fn(() => ({
      isEmpty: () => true,
      array: () => [],
    })),
  };
});

let userController, userService;
const mockUser = { id: "userId", username: "testuser", email: "test@example.com" };
const mockToken = "jwtToken";

const req = { body: {}, params: {}, user: {} };
const res = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
  attachment: jest.fn(),
};
const next = jest.fn();

beforeEach(() => {
  userService = new UserService();
  userController = new UserController(userService);

  jest.clearAllMocks();
});

describe("UserController", () => {
  describe("registerUser", () => {
    it("should register a new user successfully", async () => {
      req.body = { username: "testuser", email: "test@example.com", password: "password" };
      userService.registerUser = jest.fn().mockResolvedValue(mockUser);

      await userController.registerUser[2](req, res, next);

      expect(userService.registerUser).toHaveBeenCalledWith(new CreateUserDTO("testuser", "test@example.com", "password"));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });
  });

  describe("loginUser", () => {
    it("should log in a user and return a token", async () => {
      req.body = { email: "test@example.com", password: "password" };
      userService.loginUser = jest.fn().mockResolvedValue(mockToken);

      await userController.loginUser[2](req, res, next);

      expect(userService.loginUser).toHaveBeenCalledWith({ email: "test@example.com", password: "password" });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ token: mockToken });
    });
  });

  describe("findUserById", () => {
    it("should find a user by ID and return it", async () => {
      req.params.id = "userId";
      userService.findById = jest.fn().mockResolvedValue(mockUser);

      await userController.findUserById(req, res, next);

      expect(userService.findById).toHaveBeenCalledWith("userId");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });
  });

  describe("deleteUserById", () => {
    it("should delete a user by ID and return a result", async () => {
      req.params.id = "userId";
      const mockResult = { message: "User deleted" };
      userService.deleteById = jest.fn().mockResolvedValue(mockResult);

      await userController.deleteUserById(req, res, next);

      expect(userService.deleteById).toHaveBeenCalledWith("userId");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });
  });

  describe("deleteUserAndFiles", () => {
    it("should delete a user and their files", async () => {
      req.user.id = "userId";
      userService.deleteUserAndFiles = jest.fn().mockResolvedValue();

      await userController.deleteUserAndFiles(req, res, next);

      expect(userService.deleteUserAndFiles).toHaveBeenCalledWith("userId");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "User data and files deleted successfully" });
    });
  });

  describe("exportUserData", () => {
    it("should export user data and send a zip file", async () => {
      req.user.id = "userId";
      const mockStream = { pipe: jest.fn() };
      userService.exportUserData = jest.fn().mockResolvedValue(mockStream);

      await userController.exportUserData(req, res, next);

      expect(userService.exportUserData).toHaveBeenCalledWith("userId");
      expect(res.attachment).toHaveBeenCalledWith("user_data.zip");
      expect(mockStream.pipe).toHaveBeenCalledWith(res);
    });
  });
});
