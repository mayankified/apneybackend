"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const user_controller_1 = require("../controllers/user.controller");
const validator_1 = require("../middleware/validator");
const router = express_1.default.Router();
/**
 * @route   POST /user/favorites/add
 * @desc    Add a business to user's favorites
 * @access  Public
 */
router.post("/favorites/add", [
    (0, express_validator_1.body)("userId")
        .isInt({ min: 1 })
        .withMessage("User ID must be a valid integer"),
    (0, express_validator_1.body)("businessId")
        .isInt({ min: 1 })
        .withMessage("Business ID must be a valid integer"),
], validator_1.validateRequest, user_controller_1.addFavorite);
/**
 * @route   POST /user/favorites/remove
 * @desc    Remove a business from user's favorites
 * @access  Public
 */
router.post("/favorites/remove", [
    (0, express_validator_1.body)("userId")
        .isInt({ min: 1 })
        .withMessage("User ID must be a valid integer"),
    (0, express_validator_1.body)("businessId")
        .isInt({ min: 1 })
        .withMessage("Business ID must be a valid integer"),
], validator_1.validateRequest, user_controller_1.removeFavorite);
/**
 * @route   POST /user/favorites
 * @desc    Get list of user's favorite businesses
 * @access  Public
 */
router.post("/favorites", [
    (0, express_validator_1.body)("userId")
        .isInt({ min: 1 })
        .withMessage("User ID must be a valid integer"),
], validator_1.validateRequest, user_controller_1.getFavorites);
/**
 * @route   POST /user/review
 * @desc    Post a review for a business
 * @access  Public
 */
router.post("/review", [
    (0, express_validator_1.body)("userId")
        .isInt({ min: 1 })
        .withMessage("User ID must be a valid integer"),
    (0, express_validator_1.body)("businessId")
        .isInt({ min: 1 })
        .withMessage("Business ID must be a valid integer"),
    (0, express_validator_1.body)("content")
        .isString()
        .notEmpty()
        .withMessage("Review content cannot be empty"),
], validator_1.validateRequest, user_controller_1.postReview);
/**
 * @route   POST /user/reviews
 * @desc    Get list of user's reviews
 * @access  Public
 */
router.post("/userreviews", [
    (0, express_validator_1.body)("userId")
        .isInt({ min: 1 })
        .withMessage("User ID must be a valid integer"),
], validator_1.validateRequest, user_controller_1.getUserReviews);
router.post("/delete-account", validator_1.validateRequest, user_controller_1.deleteUser);
exports.default = router;
