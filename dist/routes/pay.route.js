"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pay_controller_1 = require("../controllers/pay.controller");
const router = express_1.default.Router();
router.post("/save", pay_controller_1.saveSubscription);
router.post("/list", pay_controller_1.getSubscriptions);
router.get("/subscription/:businessId", pay_controller_1.getSubscriptionsByBusinessId);
router.get("/create-subscription", pay_controller_1.createSubscription);
exports.default = router;
