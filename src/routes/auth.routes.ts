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
  googleLogin,
  checkUserExists,
} from "../controllers/auth.controller";
import { validateRequest } from "../middleware/validator";

const router = express.Router();

// **User Registration Route**
router.post(
  "/register",
  validateRequest,
  register
);

router.post("/edit-profile",validateRequest,editUser)
// **User Login Route**
router.post(
  "/login",
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
  validateRequest,
  businessLogin
);

router.post("/admin/login",validateRequest,loginAdmin)
router.post("/admin/new",validateRequest,registerAdmin)
router.post("/admin/delete",validateRequest,deleteAdmin)
router.post("/forgotpass",forgotPassword)
router.post("/resetpass",resetPassword)
router.post("/check-user",checkUserExists)
router.post("/google-login",googleLogin)
export default router;
