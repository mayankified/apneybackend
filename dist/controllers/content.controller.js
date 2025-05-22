"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPageContent = exports.savePageContent = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * POST /api/page-content/save
 * Body: { key: string, text: string }
 */
const savePageContent = async (req, res) => {
    try {
        const { key, text } = req.body;
        if (!key || typeof text !== "string") {
            res.status(400).json({ error: "Key and text are required" });
            return;
        }
        const content = await prisma.pageContent.upsert({
            where: { key },
            create: { key, text },
            update: { text },
        });
        res.status(200).json(content);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({ error: "Failed to save page content", details: message });
    }
};
exports.savePageContent = savePageContent;
/**
 * GET /api/page-content/list?key=homepageHeading
 */
const listPageContent = async (req, res) => {
    try {
        const key = req.query.key;
        if (!key) {
            res.status(400).json({ error: "Missing content key" });
            return;
        }
        const content = await prisma.pageContent.findUnique({
            where: { key },
        });
        if (!content) {
            res.status(404).json({ error: "Content not found" });
            return;
        }
        res.status(200).json(content);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({ error: "Failed to fetch page content", details: message });
    }
};
exports.listPageContent = listPageContent;
