export const uploadPicController = async (req, res) => {
  console.log("AHHHH");
  console.log(req.file);

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const data = {
    message: "Picture uploaded successfully",
    filename: req.file.filename,
    originalName: req.file.originalname,
    path: req.file.path,
    size: req.file.size,
  };

  return res.json(data);
};
