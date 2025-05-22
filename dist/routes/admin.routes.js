"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const admin_controller_1 = require("../controllers/admin.controller");
const validator_1 = require("../middleware/validator");
const router = express_1.default.Router();
// **Get Daywise User Created Count (Analytics)**
router.get("/analytics/user-created", admin_controller_1.getUserCreatedCountByDay);
// **Get Daywise Business Created Count (Analytics)**
router.get("/analytics/business-created", admin_controller_1.getBusinessCreatedCountByDay);
// **Mark Business as Verified**
router.post("/business/verify", [(0, express_validator_1.body)("businessId").isInt().withMessage("Business ID must be an integer")], validator_1.validateRequest, admin_controller_1.verifyBusiness);
// **Delete Business**
router.post("/business/delete", [(0, express_validator_1.body)("businessId").isInt().withMessage("Business ID must be an integer")], validator_1.validateRequest, admin_controller_1.deleteBusiness);
// **Delete User**
router.post("/user/delete", [(0, express_validator_1.body)("userId").isInt().withMessage("User ID must be an integer")], validator_1.validateRequest, admin_controller_1.deleteUser);
// **Get Total Views of All Businesses (Daywise Analytics)**
router.get("/analytics/total-views", admin_controller_1.getTotalViewsByDay);
// **List Users with limited info (Admin API)**
router.get("/users", admin_controller_1.listUsers);
// **List Businesses with limited info (Admin API)**
router.get("/businesses", admin_controller_1.listBusinesses);
router.get("/analytics/top-item", admin_controller_1.getTopItems);
router.get("/list", admin_controller_1.listAdmins);
router.get("/listbus", admin_controller_1.listAllBusinesses);
router.post("/mail", admin_controller_1.sendEmailsToRecipients);
router.post("/review/status", admin_controller_1.updateReviewStatus);
router.post("/image/status", admin_controller_1.updateImageStatus);
router.post("/task/add", admin_controller_1.createTask);
router.post("/task/update", admin_controller_1.updateTaskStatus);
router.post("/business/update", admin_controller_1.editBusiness);
router.get("/task/list/:adminId", admin_controller_1.getTasksForAdmin);
// **Route to fetch verified and non-verified reviews**
router.get("/review/list", admin_controller_1.fetchReviews);
router.get("/image/list", admin_controller_1.listImageBusinesses);
router.get("/top-bus", admin_controller_1.getTopBusinessesByViews);
router.get("/activity", admin_controller_1.listLatestActivities);
router.get("/notification", admin_controller_1.fetchNotifications);
router.get("/exportbus", admin_controller_1.listAllBusinessesNoPagination);
router.get("/exportrev", admin_controller_1.listAllReviewsNoPagination);
router.get("/getsuggestions", admin_controller_1.getAllSuggestions);
exports.default = router;
