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
  createTask,
  updateTaskStatus,
  getTasksForAdmin,
  getAllSuggestions,
  editBusiness,
} from "../controllers/admin.controller";
import { validateRequest } from "../middleware/validator";
import { authenticate } from "../middleware/authMiddleware";

const router = express.Router();

// Public GET routes (analytics, general)
router.get("/analytics/user-created", getUserCreatedCountByDay);
router.get("/analytics/business-created", getBusinessCreatedCountByDay);
router.get("/analytics/total-views", getTotalViewsByDay);
router.get("/analytics/top-item", getTopItems);
router.get("/list", authenticate, listAdmins);
router.get("/listbus", authenticate, listAllBusinesses);
router.get("/review/list", authenticate, fetchReviews);
router.get("/image/list", authenticate, listImageBusinesses);
router.get("/top-bus", authenticate, getTopBusinessesByViews);
router.get("/activity", authenticate, listLatestActivities);
router.get("/notification", authenticate, fetchNotifications);
router.get("/exportbus", authenticate, listAllBusinessesNoPagination);
router.get("/exportrev", authenticate, listAllReviewsNoPagination);
router.get("/getsuggestions", authenticate, getAllSuggestions);
router.get("/task/list/:adminId", authenticate, getTasksForAdmin);

// POST + admin sensitive routes
router.post("/business/verify",
  authenticate,
  [body("businessId").isInt().withMessage("Business ID must be an integer")],
  validateRequest,
  verifyBusiness
);

router.post("/business/delete",
  authenticate,
  [body("businessId").isInt().withMessage("Business ID must be an integer")],
  validateRequest,
  deleteBusiness
);

router.post("/user/delete",
  authenticate,
  [body("userId").isInt().withMessage("User ID must be an integer")],
  validateRequest,
  deleteUser
);

router.post("/mail", authenticate, sendEmailsToRecipients);
router.post("/review/status", authenticate, updateReviewStatus);
router.post("/image/status", authenticate, updateImageStatus);
router.post("/task/add", authenticate, createTask);
router.post("/task/update", authenticate, updateTaskStatus);
router.post("/business/update", authenticate, editBusiness);

// List users and businesses (admin only)
router.get("/users", authenticate, listUsers);
router.get("/businesses", authenticate, listBusinesses);

export default router;
