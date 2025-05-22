import express from "express";
import { createSubscription, getSubscriptions, getSubscriptionsByBusinessId, saveSubscription } from "../controllers/pay.controller";

const router = express.Router();

router.post("/save",saveSubscription)
router.post("/list",getSubscriptions)
router.get("/subscription/:businessId", getSubscriptionsByBusinessId);
router.get("/create-subscription", createSubscription);


export default router;
