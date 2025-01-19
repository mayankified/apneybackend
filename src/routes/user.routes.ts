import express from "express";
import { body } from "express-validator";
import {
  addFavorite,
  removeFavorite,
  getFavorites,
  postReview,
  getUserReviews,
} from "../controllers/user.controller";
import { validateRequest } from "../middleware/validator";

const router = express.Router();

/**
 * @route   POST /user/favorites/add
 * @desc    Add a business to user's favorites
 * @access  Public
 */
router.post(
  "/favorites/add",
  [
    body("userId")
      .isInt({ min: 1 })
      .withMessage("User ID must be a valid integer"),
    body("businessId")
      .isInt({ min: 1 })
      .withMessage("Business ID must be a valid integer"),
  ],
  validateRequest,
  addFavorite
);

/**
 * @route   POST /user/favorites/remove
 * @desc    Remove a business from user's favorites
 * @access  Public
 */
router.post(
  "/favorites/remove",
  [
    body("userId")
      .isInt({ min: 1 })
      .withMessage("User ID must be a valid integer"),
    body("businessId")
      .isInt({ min: 1 })
      .withMessage("Business ID must be a valid integer"),
  ],
  validateRequest,
  removeFavorite
);

/**
 * @route   POST /user/favorites
 * @desc    Get list of user's favorite businesses
 * @access  Public
 */
router.post(
  "/favorites",
  [
    body("userId")
      .isInt({ min: 1 })
      .withMessage("User ID must be a valid integer"),
  ],
  validateRequest,
  getFavorites
);

/**
 * @route   POST /user/review
 * @desc    Post a review for a business
 * @access  Public
 */
router.post(
  "/review",
  [
    body("userId")
      .isInt({ min: 1 })
      .withMessage("User ID must be a valid integer"),
    body("businessId")
      .isInt({ min: 1 })
      .withMessage("Business ID must be a valid integer"),
    body("content")
      .isString()
      .notEmpty()
      .withMessage("Review content cannot be empty"),
    body("rating")
      .isInt({ min: 1, max: 5 })
      .withMessage("Rating must be an integer between 1 and 5"),
  ],
  validateRequest,
  postReview
);

/**
 * @route   POST /user/reviews
 * @desc    Get list of user's reviews
 * @access  Public
 */
router.post(
  "/userreviews",
  [
    body("userId")
      .isInt({ min: 1 })
      .withMessage("User ID must be a valid integer"),
  ],
  validateRequest,
  getUserReviews
);

export default router;
