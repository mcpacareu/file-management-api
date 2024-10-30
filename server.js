const express = require("express");
const dotenv = require("dotenv");
const errorHandler = require("./src/utils/errorHandler");
const connectDB = require("./src/infrastructure/database/databaseConnection");
const userRoutes = require("./src/app/routes/userRoutes");
const fileRoutes = require("./src/app/routes/fileRoutes");
const process = require("process");

dotenv.config();

const app = express();

app.use(express.json());

app.use('/api/v1/users', userRoutes);
app.use('/api/v1/files', fileRoutes);

app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

module.exports = app;

if (process.env.NODE_ENV !== 'test' && require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
  });
}
