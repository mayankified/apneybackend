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
router.post("/edit-profile", validator_1.validateRequest, auth_controller_1.editUser);
// **User Login Route**
router.post("/login", [
    (0, express_validator_1.body)("email").isEmail().withMessage("Invalid email"),
    (0, express_validator_1.body)("password").exists().withMessage("Password is required"),
], validator_1.validateRequest, auth_controller_1.login);
// **Business Registration Route**
router.post("/business/register", validator_1.validateRequest, auth_controller_1.businessRegister);
router.post("/business/login", [
    (0, express_validator_1.body)("email").isEmail().withMessage("Invalid email"),
    (0, express_validator_1.body)("password").exists().withMessage("Password is required"),
], validator_1.validateRequest, auth_controller_1.businessLogin);
router.post("/admin/login", validator_1.validateRequest, auth_controller_1.loginAdmin);
router.post("/admin/new", validator_1.validateRequest, auth_controller_1.registerAdmin);
router.post("/admin/delete", validator_1.validateRequest, auth_controller_1.deleteAdmin);
router.post("/forgotpass", auth_controller_1.forgotPassword);
router.post("/resetpass", auth_controller_1.resetPassword);
router.post("/check-user", auth_controller_1.checkUserExists);
router.post("/google-login", auth_controller_1.googleLogin);
exports.default = router;
