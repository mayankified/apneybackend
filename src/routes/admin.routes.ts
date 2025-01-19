import express from "express";
import { body } from "express-validator";
import {
  getUserCreatedCountByDay,
  getBusinessCreatedCountByDay,
  verifyBusiness,
  deleteBusiness,
  deleteUser,
  getTotalViewsByDay,
} from "../controllers/admin.controller";
import { validateRequest } from "../middleware/validator";

const router = express.Router();

// **Get Daywise User Created Count (Analytics)**
router.get("/analytics/user-created", getUserCreatedCountByDay);

// **Get Daywise Business Created Count (Analytics)**
router.get("/analytics/business-created", getBusinessCreatedCountByDay);

// **Mark Business as Verified**
router.post(
  "/business/verify",
  [body("businessId").isInt().withMessage("Business ID must be an integer")],
  validateRequest,
  verifyBusiness
);

// **Delete Business**
router.delete(
  "/business/delete",
  [body("businessId").isInt().withMessage("Business ID must be an integer")],
  validateRequest,
  deleteBusiness
);

// **Delete User**
router.delete(
  "/user/delete",
  [body("userId").isInt().withMessage("User ID must be an integer")],
  validateRequest,
  deleteUser
);

// **Get Total Views of All Businesses (Daywise Analytics)**
router.get("/analytics/total-views", getTotalViewsByDay);

export default router;
