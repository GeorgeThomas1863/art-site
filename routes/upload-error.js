import multer from "multer";

export const uploadErrorHandler = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ error: error.message });
  } else if (error) {
    return res.status(500).json({ error: error.message });
  }
  next();
};
