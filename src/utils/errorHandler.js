/* eslint-disable no-unused-vars */
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({ message: err.message || "Server error" });
};

module.exports = errorHandler;
