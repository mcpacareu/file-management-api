/* eslint-disable no-undef */
const FileService = require('../FileService');
const ActivityLog = require('../../models/ActivityLog');
const { encryptFile, decryptFile } = require('../../../utils/encryption');
const fs = require('fs');
const crypto = require('crypto');
const uuid = require('uuid');

jest.mock('../../models/ActivityLog');
jest.mock('../../../utils/encryption');
jest.mock('fs');
jest.mock('crypto');
jest.mock('uuid');

describe('FileService', () => {
  let fileRepository;
  let fileService;

  beforeEach(() => {
    fileRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      deleteById: jest.fn(),
    };
    fileService = new FileService(fileRepository);
  });

  test('uploadFile should create a file and log the activity', async () => {
    const fileData = { user: 'user1', filename: 'file.txt' };
    fileRepository.create.mockResolvedValue(fileData);
    ActivityLog.create.mockResolvedValue({});

    const result = await fileService.uploadFile(fileData);

    expect(fileRepository.create).toHaveBeenCalledWith(fileData);
    expect(ActivityLog.create).toHaveBeenCalledWith({ user: 'user1', action: 'upload' });
    expect(result).toEqual(fileData);
  });

  describe("getFileById", () => {
    it("should fetch file and log activity", async () => {
      const mockFile = { user: "mockUserId" };
      fileRepository.findById.mockResolvedValue(mockFile);
  
      const result = await fileService.getFileById("mockFileId");
  
      expect(result).toEqual(mockFile);
      expect(ActivityLog.create).toHaveBeenCalledWith({
        user: mockFile.user,
        action: "findById",
      });
    });
  
    it("should throw error if file not found", async () => {
      fileRepository.findById.mockResolvedValue(null);
  
      await expect(fileService.getFileById("mockFileId")).rejects.toThrow(
        "File not found"
      );
    });
  });

  test('getUserFiles should return user files and log the activity', async () => {
    const files = [{ id: '1', user: 'user1' }];
    fileRepository.findByUserId.mockResolvedValue(files);
    ActivityLog.create.mockResolvedValue({});

    const result = await fileService.getUserFiles('user1');

    expect(fileRepository.findByUserId).toHaveBeenCalledWith('user1');
    expect(ActivityLog.create).toHaveBeenCalledWith({ user: 'user1', action: 'list' });
    expect(result).toEqual(files);
  });

  test('encryptAndSaveFile should encrypt and save a file', async () => {
    const tempFilePath = 'temp/path/file.txt';
    const userId = 'user1';
    const filename = 'file.txt';
    const fileSize = 1234;
    const key = Buffer.from('key');
    const iv = Buffer.from('iv');
    const encryptedFilePath = 'encrypted/path/file.txt';
  
    crypto.randomBytes.mockReturnValueOnce(key).mockReturnValueOnce(iv);
    fs.existsSync.mockReturnValue(false);
    fs.mkdirSync.mockReturnValue();
    encryptFile.mockResolvedValue();
    fileRepository.create.mockResolvedValue({
      filename,
      user: userId,
      fileSize,
      filePath: encryptedFilePath,
      encryptionKey: key.toString('hex'),
      iv: iv.toString('hex'),
    });
    ActivityLog.create.mockResolvedValue({});
  
    const result = await fileService.encryptAndSaveFile(tempFilePath, userId, filename, fileSize);
  
    expect(fs.existsSync).toHaveBeenCalledWith(expect.any(String));
    expect(fs.mkdirSync).toHaveBeenCalledWith(expect.any(String));
    expect(encryptFile).toHaveBeenCalledWith(
      tempFilePath,
      expect.stringContaining('encrypted/'),
      key,
      iv
    );
    expect(fileRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      filename,
      user: userId,
      fileSize,
      filePath: expect.stringContaining('encrypted/'),
      encryptionKey: key.toString('hex'),
      iv: iv.toString('hex'),
    }));
    expect(ActivityLog.create).toHaveBeenCalledWith({ user: userId, action: 'upload' });
    expect(result).toEqual(expect.objectContaining({
      filename,
      user: userId,
      fileSize,
      filePath: expect.stringContaining('encrypted/'), 
      encryptionKey: key.toString('hex'),
      iv: iv.toString('hex'),
    }));
  });

  test('decryptFileToTemp should decrypt a file', async () => {
    const file = { filename: 'file.txt', filePath: 'encrypted/path/file.txt', encryptionKey: 'key', iv: 'iv' };
    fs.existsSync.mockReturnValue(false);
    fs.mkdirSync.mockReturnValue();
    decryptFile.mockResolvedValue();
    uuid.v4.mockReturnValue('uuid');

    const result = await fileService.decryptFileToTemp(file);

    expect(fs.existsSync).toHaveBeenCalledWith(expect.any(String));
    expect(fs.mkdirSync).toHaveBeenCalledWith(expect.any(String));
    expect(decryptFile).toHaveBeenCalledWith(file.filePath, expect.any(String), file.encryptionKey, file.iv);
    expect(result).toEqual(expect.any(String));
  });

  test('deleteFile should delete a file and log the activity', async () => {
    const file = { id: '1', user: 'user1' };
    fileRepository.deleteById.mockResolvedValue(file);
    ActivityLog.create.mockResolvedValue({});

    const result = await fileService.deleteFile('1');

    expect(fileRepository.deleteById).toHaveBeenCalledWith('1');
    expect(ActivityLog.create).toHaveBeenCalledWith({ user: 'user1', action: 'delete' });
    expect(result).toEqual(file);
  });

  test('deleteFile should throw an error if file not found', async () => {
    fileRepository.deleteById.mockResolvedValue(null);

    await expect(fileService.deleteFile('1')).rejects.toThrow('File not found');
  });
});