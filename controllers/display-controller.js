import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const mainDisplay = async (req, res) => {
  res.sendFile(path.join(__dirname, "../html/index.html"));
};

export const adminDisplay = (req, res) => {
  res.sendFile(path.join(__dirname, "../html/admin.html"));
};

export const display401 = (req, res) => {
  res.status(401).sendFile(path.join(__dirname, "../html/401.html"));
};

export const display404 = (req, res) => {
  res.status(404).sendFile(path.join(__dirname, "../html/404.html"));
};

export const display500 = (error, req, res, next) => {
  // console.log(error);
  res.status(500).sendFile(path.join(__dirname, "../html/500.html"));
};
