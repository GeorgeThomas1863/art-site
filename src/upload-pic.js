import path from "path";
import fs from "fs";

import multer from "multer";

// import CONFIG from "../config/config.js";

import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define upload directory //CHANGE
const uploadDir = path.join(__dirname, "../public/images/products");

// Create directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Helper function to clear all files in upload directory
// export const clearUploadDirectory = () => {
//   const files = fs.readdirSync(uploadDir);
//   files.forEach((file) => {
//     const filePath = path.join(uploadDir, file);
//     if (fs.statSync(filePath).isFile()) {
//       fs.unlinkSync(filePath);
//     }
//   });
// };

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
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
        succcess: false,  message: "File not found"

    }
     }
      
      
      {
      fs.unlinkSync(filePath);
 

export { uploadDir };
