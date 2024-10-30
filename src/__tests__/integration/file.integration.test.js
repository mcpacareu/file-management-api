/* eslint-disable no-undef */
const request = require("supertest");
const app = require("../../../server");
const User = require("../../domain/models/User");
const File = require("../../domain/models/File");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { MongoMemoryServer } = require("mongodb-memory-server");
const path = require("path");
const fs = require("fs");

let tempFilePath;
let encryptedFilePath;

describe("File Upload and Download Integration Test", () => {
  let token;
  let user;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  beforeEach(async () => {
    user = new User({
      username: "testuser",
      email: "testuser@example.com",
      password: "password123",
    });
    await user.save();
    token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
  });

  afterEach(async () => {
    await User.deleteMany({});
    await File.deleteMany({});

    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    if (encryptedFilePath && fs.existsSync(encryptedFilePath)) {
      fs.unlinkSync(encryptedFilePath);
    }
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  it("should upload and download a file successfully", async () => {
    tempFilePath = path.join(__dirname, "tempFile.txt");
    fs.writeFileSync(tempFilePath, "Test file for encryption");

    const uploadResponse = await request(app)
      .post("/api/v1/files/upload")
      .set("Authorization", `Bearer ${token}`)
      .attach("file", tempFilePath);

    expect(uploadResponse.status).toBe(201);
    expect(uploadResponse.body).toHaveProperty("_id");

    const fileId = uploadResponse.body._id;

    const fileInDb = await File.findById(fileId);
    expect(fileInDb).not.toBeNull();
    encryptedFilePath = fileInDb.filePath;

    const downloadResponse = await request(app)
      .get(`/api/v1/files/download/${fileId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(downloadResponse.status).toBe(200);

    expect(downloadResponse.text).toBe("Test file for encryption");
  });
});
