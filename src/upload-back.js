import path from "path";
import fs from "fs";

import multer from "multer";
import sharp from "sharp";

import { fileURLToPath } from "url";
import { dirname } from "path";
import { sanitizeFilename } from "./sanitize.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define upload directory //CHANGE
const uploadDir = path.join(__dirname, "../public/images");

// Create directories if they don't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

fs.mkdirSync(path.join(uploadDir, "newsletter"), { recursive: true });

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let targetDir;
    if (req.path === "/upload-product-pic-route") {
      targetDir = path.join(uploadDir, "products");
    } else if (req.path === "/upload-event-pic-route") {
      targetDir = path.join(uploadDir, "events");
    } else if (req.path === "/upload-newsletter-pic-route") {
      targetDir = path.join(uploadDir, "newsletter");
    }
    cb(null, targetDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + sanitizeFilename(file.originalname));
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

export const deletePic = async (filename, entityType) => {
  const allowedTypes = ["products", "events", "newsletter"];
  if (!entityType || !allowedTypes.includes(entityType)) {
    return { success: false, message: "Invalid entity type" };
  }

  const safeName = sanitizeFilename(filename);
  if (!safeName) return { success: false, message: "Invalid filename" };

  const filePath = path.join(uploadDir, entityType, safeName);
  const resolvedPath = path.resolve(filePath);
  const allowedBase = path.resolve(path.join(uploadDir, entityType));

  if (!resolvedPath.startsWith(allowedBase + path.sep)) {
    return { success: false, message: "Invalid file path" };
  }

  if (!fs.existsSync(resolvedPath)) {
    return { success: false, message: "File not found" };
  }

  fs.unlinkSync(resolvedPath);
  return { success: true, message: "File deleted successfully" };
};

export const resizeNewsletterImage = async (filePath) => {
  try {
    //console.log("[resize] filePath:", filePath, "| exists:", fs.existsSync(filePath));
    const inputBuffer = await fs.promises.readFile(filePath);
    const outputBuffer = await sharp(inputBuffer)
      .resize({ width: 600 })
      .toBuffer();
    await fs.promises.writeFile(filePath, outputBuffer);
  } catch (err) {
    console.error("Newsletter image resize failed:", err.message);
    // Non-fatal: original file still usable if resize fails
  }
};

export { uploadDir };
