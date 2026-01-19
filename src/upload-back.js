import path from "path";
import fs from "fs";

import multer from "multer";

// import CONFIG from "../config/config.js";

import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define upload directory //CHANGE
const uploadDir = path.join(__dirname, "../public/images");

// Create directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let targetDir;
    if (req.path === "/upload-product-pic-route") {
      targetDir = path.join(uploadDir, "products");
    } else if (req.path === "/upload-event-pic-route") {
      targetDir = path.join(uploadDir, "events");
    }
    cb(null, targetDir);
  },
  filename: function (req, file, cb) {
    // keep the original name since we're only storing one file
    cb(null, file.originalname);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpg|jpeg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
  }
};

// Configure multer
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

//-------------------

export const runDeletePic = async (filename) => {
  const filePath = path.join(uploadDir, filename);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return { success: false, message: "File not found" };
  }

  fs.unlinkSync(filePath);
  return { success: true, message: "File deleted successfully" };
};

export { uploadDir };
