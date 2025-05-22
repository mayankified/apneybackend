// src/controllers/pageContentController.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * POST /api/page-content/save
 * Body: { key: string, text: string }
 */
export const savePageContent = async (req: Request, res: Response): Promise<void> => {
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: "Failed to save page content", details: message });
  }
};

/**
 * GET /api/page-content/list?key=homepageHeading
 */
export const listPageContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const key = req.query.key as string;
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: "Failed to fetch page content", details: message });
  }
};
