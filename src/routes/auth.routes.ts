import express from "express";
import { body } from "express-validator";
import {
  register,
  login,
  businessRegister,
  businessLogin,
} from "../controllers/auth.controller";
import { validateRequest } from "../middleware/validator";

const router = express.Router();

// **User Registration Route**
router.post(
  "/register",
  [
    body("email").isEmail().withMessage("Invalid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
    body("name").notEmpty().withMessage("Name is required"),
    body("phone").notEmpty().withMessage("Phone number is required"),
  ],
  validateRequest,
  register
);

// **User Login Route**
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Invalid email"),
    body("password").exists().withMessage("Password is required"),
  ],
  validateRequest,
  login
);

// **Business Registration Route**
router.post(
  "/business/register",
  [
    body("email").isEmail().withMessage("Invalid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
    body("ownerName").notEmpty().withMessage("Owner name is required"),
    body("businessName").notEmpty().withMessage("Business name is required"),
    body("description").notEmpty().withMessage("Description is required"),
    body("address").notEmpty().withMessage("Address is required"),
    body("longitude").isFloat().withMessage("Longitude must be a valid number"),
    body("latitude").isFloat().withMessage("Latitude must be a valid number"),
    body("phoneNumber").notEmpty().withMessage("Phone number is required"),
    body("category").notEmpty().withMessage("Business category is required"),
    body("tags").isArray().withMessage("Tags must be an array"),
    body("features").isArray().withMessage("Features must be an array"),
    body("timing").isArray().withMessage("Timing must be an array"),
  ],
  validateRequest,
  businessRegister
);

router.post(
  "/business/login",
  [
    body("email").isEmail().withMessage("Invalid email"),
    body("password").exists().withMessage("Password is required"),
  ],
  validateRequest,
  businessLogin
);

export default router;
