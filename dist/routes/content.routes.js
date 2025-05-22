"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/pageContent.ts
const express_1 = __importDefault(require("express"));
const content_controller_1 = require("../controllers/content.controller");
const router = express_1.default.Router();
/**
 * POST /api/page-content/save
 * Body: { key: string, text: string }
 */
router.post("/save", content_controller_1.savePageContent);
/**
 * GET /api/page-content/list?key=homepageHeading
 */
router.get("/list", content_controller_1.listPageContent);
exports.default = router;
