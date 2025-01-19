"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const auth_controller_1 = require("../controllers/auth.controller");
const validator_1 = require("../middleware/validator");
const router = express_1.default.Router();
// **User Registration Route**
router.post("/register", [
    (0, express_validator_1.body)("email").isEmail().withMessage("Invalid email"),
    (0, express_validator_1.body)("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long"),
    (0, express_validator_1.body)("name").notEmpty().withMessage("Name is required"),
    (0, express_validator_1.body)("phone").notEmpty().withMessage("Phone number is required"),
], validator_1.validateRequest, auth_controller_1.register);
// **User Login Route**
router.post("/login", [
    (0, express_validator_1.body)("email").isEmail().withMessage("Invalid email"),
    (0, express_validator_1.body)("password").exists().withMessage("Password is required"),
], validator_1.validateRequest, auth_controller_1.login);
// **Business Registration Route**
router.post("/business/register", [
    (0, express_validator_1.body)("email").isEmail().withMessage("Invalid email"),
    (0, express_validator_1.body)("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long"),
    (0, express_validator_1.body)("ownerName").notEmpty().withMessage("Owner name is required"),
    (0, express_validator_1.body)("businessName").notEmpty().withMessage("Business name is required"),
    (0, express_validator_1.body)("description").notEmpty().withMessage("Description is required"),
    (0, express_validator_1.body)("address").notEmpty().withMessage("Address is required"),
    (0, express_validator_1.body)("longitude").isFloat().withMessage("Longitude must be a valid number"),
    (0, express_validator_1.body)("latitude").isFloat().withMessage("Latitude must be a valid number"),
    (0, express_validator_1.body)("phoneNumber").notEmpty().withMessage("Phone number is required"),
    (0, express_validator_1.body)("category").notEmpty().withMessage("Business category is required"),
    (0, express_validator_1.body)("tags").isArray().withMessage("Tags must be an array"),
    (0, express_validator_1.body)("features").isArray().withMessage("Features must be an array"),
    (0, express_validator_1.body)("timing").isArray().withMessage("Timing must be an array"),
], validator_1.validateRequest, auth_controller_1.businessRegister);
router.post("/business/login", [
    (0, express_validator_1.body)("email").isEmail().withMessage("Invalid email"),
    (0, express_validator_1.body)("password").exists().withMessage("Password is required"),
], validator_1.validateRequest, auth_controller_1.businessLogin);
exports.default = router;
