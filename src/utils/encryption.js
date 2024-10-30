const crypto = require("crypto");
const fs = require("fs");

const algorithm = "aes-256-cbc";
const { Buffer } = require("buffer");

const encryptFile = (filePath, destPath, key, iv) => {
  return new Promise((resolve, reject) => {
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const input = fs.createReadStream(filePath);
    const output = fs.createWriteStream(destPath);

    input.pipe(cipher).pipe(output);

    output.on("finish", () => resolve());
    output.on("error", reject);
  });
};

const decryptFile = (filePath, destPath, encryptionKey, iv) => {
  return new Promise((resolve, reject) => {
    const encryptionKeyBuffer = Buffer.from(encryptionKey, "hex");
    const ivBuffer = Buffer.from(iv, "hex");
    const decipher = crypto.createDecipheriv(
      algorithm,
      encryptionKeyBuffer,
      ivBuffer
    );
    const input = fs.createReadStream(filePath);
    const output = fs.createWriteStream(destPath);

    input.pipe(decipher).pipe(output);

    output.on("finish", () => resolve());
    output.on("error", async (err) => {
      console.error("Error during decryption:", err);
      await fs.promises.unlink(destPath);
      reject(err);
    });
  });
};

module.exports = {
  encryptFile,
  decryptFile,
};
