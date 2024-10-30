/* eslint-disable no-undef */
const request = require("supertest");
const app = require("../../../server");
const UserModel = require("../../domain/models/User");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

let mongoServer;

describe("User Registration Integration Test", () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await UserModel.deleteMany({});
  });

  it("should register a new user", async () => {
    const newUser = {
      username: "testuser",
      email: "testuser@example.com",
      password: "password123",
    };

    const response = await request(app)
      .post("/api/v1/users/register")
      .send(newUser);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("username", "testuser");
    expect(response.body).toHaveProperty("email", "testuser@example.com");

    const userInDb = await UserModel.findOne({ email: "testuser@example.com" });
    expect(userInDb).not.toBeNull();
    expect(userInDb.username).toBe("testuser");
  });

  it("should return 409 if email is already in use", async () => {
    const existingUser = new UserModel({
      username: "existinguser",
      email: "testuser@example.com",
      password: "password123",
    });
    await existingUser.save();

    const newUser = {
      username: "newuser",
      email: "testuser@example.com",
      password: "password123",
    };

    const response = await request(app)
      .post("/api/v1/users/register")
      .send(newUser);

    expect(response.status).toBe(409);
    expect(response.body).toHaveProperty("message", "Email already in use");
  });
});
