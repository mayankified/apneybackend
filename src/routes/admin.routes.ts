import express from "express";
import { body } from "express-validator";
import {
  getUserCreatedCountByDay,
  getBusinessCreatedCountByDay,
  verifyBusiness,
  deleteBusiness,
  deleteUser,
  getTotalViewsByDay,
  listUsers,
  listBusinesses,
  getTopItems,
  listAdmins,
  listAllBusinesses,
  sendEmailsToRecipients,
  updateReviewStatus,
  fetchReviews,
  getTopBusinessesByViews,
  updateImageStatus,
  listImageBusinesses,
  listLatestActivities,
  fetchNotifications,
  listAllBusinessesNoPagination,
  listAllReviewsNoPagination,
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
router.post(
  "/business/delete",
  [body("businessId").isInt().withMessage("Business ID must be an integer")],
  validateRequest,
  deleteBusiness
);

// **Delete User**
router.post(
  "/user/delete",
  [body("userId").isInt().withMessage("User ID must be an integer")],
  validateRequest,
  deleteUser
);

// **Get Total Views of All Businesses (Daywise Analytics)**
router.get("/analytics/total-views", getTotalViewsByDay);

// **List Users with limited info (Admin API)**
router.get("/users", listUsers);

// **List Businesses with limited info (Admin API)**
router.get("/businesses", listBusinesses);

router.get("/analytics/top-item", getTopItems);
router.get("/list", listAdmins);
router.get("/listbus",listAllBusinesses)
router.post("/mail",sendEmailsToRecipients)
router.post("/review/status", updateReviewStatus);
router.post("/image/status", updateImageStatus);

// **Route to fetch verified and non-verified reviews**
router.get("/review/list", fetchReviews);
router.get("/image/list", listImageBusinesses);
router.get("/top-bus", getTopBusinessesByViews);
router.get("/activity", listLatestActivities);
router.get("/notification", fetchNotifications);
router.get("/exportbus", listAllBusinessesNoPagination);
router.get("/exportrev", listAllReviewsNoPagination);
export default router;
