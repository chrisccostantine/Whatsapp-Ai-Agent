import { Router } from "express";
import {
  searchProductsController,
  syncProductsController,
} from "../controllers/shopify.controller.js";

const router = Router();

router.post("/sync", syncProductsController);
router.get("/search", searchProductsController);

export default router;
