const cluster = require("cluster");
const os = require("os");
const express = require("express");
const dotenv = require("dotenv");
const errorHandler = require("./src/utils/errorHandler");
const connectDB = require("./src/app/infrastructure/database/database");
const process = require("process");

dotenv.config();

const PORT = process.env.PORT || 5000;

if (cluster.isMaster) {
  // Create a worker process for each available CPU core
  const numCPUs = os.cpus().length;
  console.log(`Master ${process.pid} is running`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Listen for when a worker dies and restart it
  //cluster.on("exit", (worker, code, signal) => {
    cluster.on("exit", (worker) => {
    console.log(`Worker ${worker.process.pid} died. Starting a new one...`);
    cluster.fork();
  });
} else {
  const app = express();

  app.use(express.json());
  app.use(errorHandler);

  connectDB();

  app.listen(PORT, () => {
    console.log(`Worker ${process.pid} started on port ${PORT}`);
  });
}