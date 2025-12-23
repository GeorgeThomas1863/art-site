import { runAddNewProduct, runEditProduct, runDeleteProduct, runGetProductData } from "../src/products.js";

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

export const addNewProductController = async (req, res) => {
  const inputParams = req.body;
  if (!inputParams) return res.status(500).json({ error: "No input parameters" });

  const data = await runAddNewProduct(inputParams);
  return res.json(data);
};

export const editProductController = async (req, res) => {
  const inputParams = req.body;
  if (!inputParams) return res.status(500).json({ error: "No input parameters" });

  const data = await runEditProduct(inputParams);
  return res.json(data);
};

export const deleteProductController = async (req, res) => {
  const productId = req.body.productId;
  if (!productId) return res.status(500).json({ error: "No product ID" });

  const data = await runDeleteProduct(productId);
  return res.json(data);
};

//returns data for all products
export const getProductDataController = async (req, res) => {
  console.log("GET PRODUCT DATA CONTROLLER");
  const data = await runGetProductData();
  console.log("DATA");
  console.dir(data);
  return res.json(data);
};
