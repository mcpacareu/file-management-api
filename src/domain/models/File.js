const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  filename: { type: String, required: true, index: true },
  uploadDate: { type: Date, default: Date.now },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  fileSize: { type: Number, required: true },
  filePath: { type: String, required: true },
  encryptionKey: { type: String, required: true },
  iv: { type: String, required: true },
});

module.exports = mongoose.model("File", fileSchema);
