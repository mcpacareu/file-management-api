/* eslint-disable no-undef */
const express = require("express");
const FileController = require("../FileController");
const FileService = require("../../../domain/services/FileService");
const fs = require("fs");
const AppError = require("../../../utils/AppError");

jest.mock("fs");

let app, fileService, fileController, req, res, next;
const mockFile = { filename: "test.txt", size: 1024 };

fs.existsSync = jest.fn().mockReturnValue(true);
fs.unlink = jest.fn((_, callback) => callback(null));

describe("FileController", () => {
  beforeEach(() => {
    req = {
      file: mockFile,
      user: { id: "mockUserId" },
      params: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };

    next = jest.fn();

    fileService = new FileService();
    fileController = new FileController(fileService);
    app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      req.user = { id: "mockUserId" };
      next();
    });
    app.post("/upload", fileController.uploadFile);
    app.get("/files", fileController.getFiles);
    app.get("/download/:id", fileController.downloadFile);
    app.delete("/delete/:id", fileController.deleteFile);
  });

  describe("uploadFile", () => {
    it("should upload and save an encrypted file successfully", async () => {
      req.file = mockFile;

      const mockSavedFile = {
        _id: "fileId",
        filename: mockFile.filename,
        user: req.user.id,
        fileSize: mockFile.size,
      };

      fileService.encryptAndSaveFile = jest
        .fn()
        .mockResolvedValue(mockSavedFile);

      await fileController.uploadFile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockSavedFile);
    });

    it("should return 404 if the temp file does not exist", async () => {
      req.file = { filename: "nonexistent.txt" };
      fs.existsSync.mockReturnValue(false);

      await fileController.uploadFile(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].statusCode).toBe(404);
      expect(next.mock.calls[0][0].message).toContain(
        "File not found in the temporal path"
      );
    });
  });

  describe("getFiles", () => {
    it("should return the list of files for the user", async () => {
      const mockFiles = [{ filename: "file1.txt" }, { filename: "file2.txt" }];
      fileService.getUserFiles = jest.fn().mockResolvedValue(mockFiles);

      await fileController.getFiles(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockFiles);
    });
  });

  describe("downloadFile", () => {
    it("should download a decrypted file if user is authorized", async () => {
      req.params = { id: "fileId" };
      req.user = { id: "mockUserId" };

      const mockFile = {
        _id: "fileId",
        filename: "test.txt",
        user: req.user.id,
        filePath: "/path/to/encrypted/file",
        encryptionKey: "mockKey",
        iv: "mockIv",
      };

      fileService.getFileById = jest.fn().mockResolvedValue(mockFile);
      fileService.decryptFileToTemp = jest
        .fn()
        .mockResolvedValue("../../../../storage/decrypted/test.txt");

      res.download = jest.fn((filePath, callback) => callback(null));

      await fileController.downloadFile(req, res, next);

      expect(res.download).toHaveBeenCalledWith(
        "../../../../storage/decrypted/test.txt",
        expect.any(Function)
      );

      expect(fs.unlink).toHaveBeenCalledWith(
        "../../../../storage/decrypted/test.txt",
        expect.any(Function)
      );
    });

    it("should return 403 if the user is not authorized to download the file", async () => {
      req.params = { id: "fileId" };
      req.user = { id: "mockUserId" };

      const mockFile = { _id: "fileId", user: "otherUserId" };
      fileService.getFileById = jest.fn().mockResolvedValue(mockFile);

      await fileController.downloadFile(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Forbidden", statusCode: 403 })
      );
    });
  });

  describe("deleteFile", () => {
    it("should delete the file if the user is authorized", async () => {
      req.params = { id: "fileId" };
      req.user = { id: "mockUserId" };
      const mockFile = { _id: "fileId", user: req.user.id };

      fileService.getFileById = jest.fn().mockResolvedValue(mockFile);
      fileService.deleteFile = jest.fn().mockResolvedValue(mockFile);

      await fileController.deleteFile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(204);
    });

    it("should return 403 if the user is not authorized to delete the file", async () => {
      const mockFile = { _id: "fileId", user: "otherUserId" };

      req.params = { id: "fileId" };
      req.user = { id: "mockUserId" };

      fileService.getFileById = jest.fn().mockResolvedValue(mockFile);

      await fileController.deleteFile(req, res, next);

      await fileController.deleteFile(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Forbidden", statusCode: 403 })
      );
    });
  });
});
