// src/routes/pageContent.ts
import express from "express";
import { listPageContent, savePageContent } from "../controllers/content.controller";

const router = express.Router();

/**
 * POST /api/page-content/save
 * Body: { key: string, text: string }
 */
router.post("/save", savePageContent);

/**
 * GET /api/page-content/list?key=homepageHeading
 */
router.get("/list", listPageContent);

export default router;
