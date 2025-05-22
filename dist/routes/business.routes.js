"use strict";
// src/routes/business.routes.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const business_controller_1 = require("../controllers/business.controller");
const validator_1 = require("../middleware/validator");
const router = express_1.default.Router();
/**
 * @route   GET /business/list
 * @desc    Fetch a list of businesses based on search queries with pagination
 * @access  Public
 */
router.post("/list", [
    // Pagination parameters
    (0, express_validator_1.query)("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Page must be an integer greater than 0"),
    (0, express_validator_1.query)("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("Limit must be an integer between 1 and 100"),
    (0, express_validator_1.query)("q").optional().isString().withMessage("Query must be a string"),
    (0, express_validator_1.query)("category")
        .optional()
        .isString()
        .withMessage("Category must be a string"),
    (0, express_validator_1.query)("tags")
        .optional()
        .isArray()
        .withMessage("Tags must be an array of strings"),
    (0, express_validator_1.query)("features")
        .optional()
        .isArray()
        .withMessage("Features must be an array of strings"),
    (0, express_validator_1.query)("isOpen")
        .optional()
        .isBoolean()
        .withMessage("isOpen must be a boolean"),
], validator_1.validateRequest, business_controller_1.listBusinesses);
router.post("/suggestions", [
    // Validate body input
    (0, express_validator_1.body)("text")
        .isString()
        .withMessage("Text must be a string")
        .notEmpty()
        .withMessage("Text cannot be empty"),
], validator_1.validateRequest, business_controller_1.searchSuggestions // Controller for search suggestions
);
router.get("/:id", [
    // Validate ID parameter
    (0, express_validator_1.param)("id")
        .isInt({ min: 1 })
        .withMessage("Business ID must be a valid integer"),
], validator_1.validateRequest, business_controller_1.getBusinessById // Controller for fetching business details by ID
);
router.get("/busdata/:id", validator_1.validateRequest, business_controller_1.getBusinessStats);
router.post("/togglestatus", validator_1.validateRequest, business_controller_1.toggleBusinessOpenState);
router.get("/getreviews/:id", validator_1.validateRequest, business_controller_1.getBusinessReviews);
router.get("/anal/:id", validator_1.validateRequest, business_controller_1.getBusinessAnalytics);
router.post("/search-suggestions", validator_1.validateRequest, business_controller_1.getSearchSuggestions);
router.post("/delete-account", validator_1.validateRequest, business_controller_1.deleteBusiness);
router.post("/update-image", validator_1.validateRequest, business_controller_1.updateImage);
router.post("/getbusbycat", validator_1.validateRequest, business_controller_1.listBusinessesByCategory);
router.post("/replyreview", validator_1.validateRequest, business_controller_1.addBusinessResponse);
router.post("/addsuggestion", validator_1.validateRequest, business_controller_1.createBusinessSuggestion);
exports.default = router;
