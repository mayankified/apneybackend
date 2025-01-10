import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

// **User Sign-up**
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, phone, occupation, otherOccupation } =
      req.body;
    console.log(req.body);
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        occupation,
        otherOccupation,
      },
    });

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "1h" });

    // res.status(201).json({ user, token });
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({ user: userWithoutPassword, token });

    return; // Ensures that the function returns `void`
  } catch (error: unknown) {
    if (error instanceof Error) {
      if ((error as any).code === "P2002") {
        res.status(400).json({ error: "Email or phone number already exists" });
        return;
      }
      res
        .status(500)
        .json({ error: "Error creating user account", details: error.message });
      return;
    }
    res.status(500).json({ error: "Unknown error occurred" });
    return;
  }
};

// **User Sign-in**
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "1h" });

    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({ user: userWithoutPassword, token });

    return;
  } catch (error: unknown) {
    if (error instanceof Error) {
      res
        .status(500)
        .json({ error: "Error logging in", details: error.message });
      return;
    }
    res.status(500).json({ error: "Unknown error occurred" });
    return;
  }
};


// **Business Sign-up**
export const businessRegister = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      email,
      password,
      ownerName,
      businessName,
      description,
      address,
      phoneNumber,
      longitude,
      latitude,
      category,
      tags,
      features,
      timing,
      keywords, // Expect an array of keywords (e.g., ["Bakery", "Gym"])
      streetaddress,
      city,
      country,
      zipcode,
      state,
      websiteUrl,
      documents,
    } = req.body;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create or connect keywords
    const keywordConnections = (keywords || []).map((keyword: string) => ({
      where: { name: keyword.trim() },
      create: {
        name: keyword.trim(),
        slug: keyword.trim().toLowerCase().replace(/ /g, "-"),
      },
    }));

    // Create a new business entry
    const business = await prisma.business.create({
      data: {
        email,
        password: hashedPassword,
        ownerName,
        businessName,
        description,
        address,
        phoneNumber,
        longitude,
        latitude,
        category,
        tags,
        features,
        timing,
        streetaddress,
        city,
        country,
        zipcode,
        state,
        websiteUrl,
        documents: documents || [], // Ensure an empty array if not provided
        isOpen: true,
        isVerified: false,
        keywords: {
          connectOrCreate: keywordConnections, // Create new keywords if they don't exist
        },
      },
    });

    // Generate a JWT token
    const token = jwt.sign({ id: business.id }, JWT_SECRET, {
      expiresIn: "1h",
    });

    // Respond with created business and token
    res.status(201).json({ business, token });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if ((error as any).code === "P2002") {
        res.status(400).json({ error: "Business email or name already exists" });
        return;
      }
      res.status(500).json({
        error: "Error creating business account",
        details: error.message,
      });
      return;
    }
    res.status(500).json({ error: "Unknown error occurred" });
  }
};



// **Business Sign-in**
export const businessLogin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    const business = await prisma.business.findUnique({ where: { email } });
    if (!business?.password) {
      res.status(401).json({ error: "Business not found" });
      return;
    }
    if (!business || !(await bcrypt.compare(password, business.password))) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = jwt.sign({ id: business.id }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ business, token });
    return;
  } catch (error: unknown) {
    if (error instanceof Error) {
      res
        .status(500)
        .json({ error: "Error logging in", details: error.message });
      return;
    }
    res.status(500).json({ error: "Unknown error occurred" });
    return;
  }
};
