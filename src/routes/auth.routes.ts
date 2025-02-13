import express from "express";
import { body } from "express-validator";
import {
  register,
  login,
  businessRegister,
  businessLogin,
  loginAdmin,
  registerAdmin,
  deleteAdmin,
  forgotPassword,
  resetPassword,
  editUser,
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

router.post("/edit-profile",validateRequest,editUser)
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

router.post("/admin/login",validateRequest,loginAdmin)
router.post("/admin/new",validateRequest,registerAdmin)
router.post("/admin/delete",validateRequest,deleteAdmin)
router.post("/forgotpass",forgotPassword)
router.post("/resetpass",resetPassword)
export default router;
