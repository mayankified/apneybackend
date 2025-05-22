// src/routes/business.routes.ts

import express from "express";
import { query, body, param } from "express-validator";
import {
  addBusinessResponse,
  createBusinessSuggestion,
  deleteBusiness,
  getBusinessAnalytics,
  getBusinessById,
  getBusinessReviews,
  getBusinessStats,
  getSearchSuggestions,
  listBusinesses,
  listBusinessesByCategory,
  searchSuggestions,
  toggleBusinessOpenState,
  updateImage,
} from "../controllers/business.controller";
import { validateRequest } from "../middleware/validator";
import { authenticate } from "../middleware/authMiddleware";

const router = express.Router();

/**
 * @route   GET /business/list
 * @desc    Fetch a list of businesses based on search queries with pagination
 * @access  Public
 */
router.post(
  "/list",
  [
    // Pagination parameters
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be an integer greater than 0"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be an integer between 1 and 100"),

  
    query("q").optional().isString().withMessage("Query must be a string"),
    query("category")
      .optional()
      .isString()
      .withMessage("Category must be a string"),
    query("tags")
      .optional()
      .isArray()
      .withMessage("Tags must be an array of strings"),
    query("features")
      .optional()
      .isArray()
      .withMessage("Features must be an array of strings"),
    query("isOpen")
      .optional()
      .isBoolean()
      .withMessage("isOpen must be a boolean"),
  ],
  validateRequest,
  listBusinesses
);

router.post(
  "/suggestions",
  [
    // Validate body input
    body("text")
      .isString()
      .withMessage("Text must be a string")
      .notEmpty()
      .withMessage("Text cannot be empty"),
  ],
  validateRequest,
  searchSuggestions // Controller for search suggestions
);
router.get(
  "/:id",
  [
    // Validate ID parameter
    param("id")
      .isInt({ min: 1 })
      .withMessage("Business ID must be a valid integer"),
  ],
  validateRequest,
  getBusinessById // Controller for fetching business details by ID
);
router.get("/busdata/:id", validateRequest, getBusinessStats);
router.post("/togglestatus", validateRequest, toggleBusinessOpenState);
router.get("/getreviews/:id", validateRequest, getBusinessReviews);
router.get("/anal/:id",authenticate, validateRequest, getBusinessAnalytics);
router.post("/search-suggestions",validateRequest, getSearchSuggestions);
router.post("/delete-account",authenticate,validateRequest,deleteBusiness)
router.post("/update-image",authenticate,validateRequest,updateImage)
router.post("/getbusbycat",validateRequest,listBusinessesByCategory)
router.post("/replyreview",validateRequest,addBusinessResponse)
router.post("/addsuggestion",validateRequest,createBusinessSuggestion)
export default router;
