const multer = require("multer");
const path = require("path");

const basePath = path.join(__dirname, "../../..", "storage");
const uploadsDir = process.env.UPLOADS_DIR || path.join(basePath, "uploads");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "file-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
