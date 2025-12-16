export const uploadPicController = async (req, res) => {
  if (!req.pic) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const data = {
    message: "Picture uploaded successfully",
    filename: req.pic.filename,
    originalName: req.pic.originalname,
    path: req.pic.path,
    size: req.pic.size,
  };

  return res.json(data);
};
