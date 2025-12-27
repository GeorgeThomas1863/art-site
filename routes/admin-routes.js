import express from "express";
import requireAuth from "../middleware/auth-middle.js";

import { authController } from "../controllers/auth-controller.js";
import { adminDisplay } from "../controllers/display-controller.js";
import { uploadPicController, addNewProductController, editProductController, deleteProductController } from "../controllers/data-controller.js"; //prettier-ignore
import { upload } from "../src/upload-pic.js";

const router = express.Router();

// Login AUTH route
router.post("/admin/site-auth-route", authController);

router.get("/admin", requireAuth, adminDisplay);

router.post("/admin/upload-pic-route", requireAuth, upload.single("image"), uploadPicController);

router.post("/admin/add-new-product-route", requireAuth, addNewProductController);

router.post("/admin/edit-product-route", requireAuth, editProductController);

router.post("/admin/delete-product-route", requireAuth, deleteProductController);

export default router;
