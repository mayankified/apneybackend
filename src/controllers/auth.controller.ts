import { Request, Response } from "express";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/mail";
import { deleteFileFromS3 } from "../utils/awsUtils";
import { getCoordinatesFromAddress } from "../utils/MAPBOX";

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
      include: {
        favorites: true, // Include user's favorite businesses in the response
      },
    });

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "1h" });

    // res.status(201).json({ user, token });
    await sendEmail(
      email,
      "Welcome to Apneyy",
      `Hello ${name},\n\nWelcome to Apneyy! We are excited to have you on board.\n\nBest,\nTeam Apneyy`
    );
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

// **Edit User**
export const editUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone, occupation, otherOccupation, avatar } =
      req.body;
    console.log(req.body);
    // Validate that at least one field is provided to update
    if (!email) {
      res.status(400).json({ error: "No fields provided to update" });
      return;
    }

    // Fetch the user to ensure it exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email as string },
    });

    if (!existingUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Update the user's information
    const updatedUser = await prisma.user.update({
      where: { email: email as string },
      data: {
        name: name || existingUser.name,
        email: email || existingUser.email,
        phone: phone || existingUser.phone,
        occupation: occupation || existingUser.occupation,
        otherOccupation: otherOccupation || existingUser.otherOccupation,
        avatar: avatar || existingUser.avatar,
      },
      include: {
        favorites: true, // Optionally include related data, if needed
      },
    });

    const { password, ...userWithoutPassword } = updatedUser;

    res.status(200).json({
      message: "User updated successfully",
      user: userWithoutPassword,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if ((error as any).code === "P2002") {
        res.status(400).json({ error: "Email or phone number already exists" });
        return;
      }
      res
        .status(500)
        .json({ error: "Error updating user", details: error.message });
      return;
    }
    res.status(500).json({ error: "Unknown error occurred" });
  }
};

// **User Sign-in**
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    console.log(email, password);
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        favorites: true, // Include user's favorite businesses in the response
      },
    });

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

export const checkUserExists = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    res.status(200).json({ exists: !!user });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({ error: "Error checking user", details: errorMessage });
  }
};
export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({
      where: { email },
      include: { favorites: true },
    });

    if (!user) {
      res.status(401).json({ error: "User not found. Please sign up first." });
      return;
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "1h" });


    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({ user: userWithoutPassword, token });


    return;
  } catch (error) {
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

export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, role } = req.body;

    if (!role || !["user", "business"].includes(role)) {
      res.status(400).json({ error: "Invalid role provided" });
      return;
    }

    let record;

    if (role === "user") {
      record = await prisma.user.findUnique({ where: { email } });
    } else if (role === "business") {
      record = await prisma.business.findUnique({ where: { email } });
    }

    if (!record) {
      res.status(404).json({ error: `No ${role} found with this email` });
      return;
    }

    // Generate a secure reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 1000 * 60 * 60); // 1-hour expiry

    // Save token and expiry in the database
    if (role === "user") {
      await prisma.user.update({
        where: { email },
        data: { resetToken, resetTokenExpiry },
      });
    } else if (role === "business") {
      await prisma.business.update({
        where: { email },
        data: { resetToken, resetTokenExpiry },
      });
    }

    // Generate the reset link
    const resetLink =
      role === "user"
        ? `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
        : `${process.env.VENDOR_URL}/reset-password?token=${resetToken}`;

    // Send the reset email
    const message = `
      <p>You requested a password reset.</p>
      <p>Click <a href="${resetLink}" target="_blank">here</a> to reset your password.</p>
      <p>This link will expire in 1 hour.</p>
    `;
    await sendEmail(email, "Password Reset Request", message);

    res.status(200).json({
      message: `Password reset link sent to your ${role} email `,
    });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res
      .status(500)
      .json({ error: "Internal server error", details: errorMessage });
  }
};

export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token, newPassword, role } = req.body;

    if (!role || !["user", "business"].includes(role)) {
      res.status(400).json({ error: "Invalid role provided" });
      return;
    }

    let record;

    if (role === "user") {
      record = await prisma.user.findFirst({
        where: {
          resetToken: token,
          resetTokenExpiry: { gte: new Date() }, // Check if token is valid
        },
      });
    } else if (role === "business") {
      record = await prisma.business.findFirst({
        where: {
          resetToken: token,
          resetTokenExpiry: { gte: new Date() }, // Check if token is valid
        },
      });
    }

    if (!record) {
      res.status(400).json({ error: "Invalid or expired reset token" });
      return;
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the record's password and clear the reset token
    if (role === "user") {
      await prisma.user.update({
        where: { id: record.id },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
        },
      });
    } else if (role === "business") {
      await prisma.business.update({
        where: { id: record.id },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
        },
      });
    }

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res
      .status(500)
      .json({ error: "Internal server error", details: errorMessage });
  }
};

export const businessRegister = async (
  req: Request,
  res: Response
): Promise<void> => {
  console.log("Body:", req.body);
  let documentsToDelete: string[] = [];
  let photosToDelete: string[] = [];
  try {
    const {
      email,
      password,
      ownerName,
      businessName,
      description,
      phoneNumber,
      category,
      tags,
      features,
      timing,
      documents,
      streetaddress,
      city,
      country,
      zipcode,
      state,
      websiteUrl,
      imageUrls,
    } = req.body;

    if (!email || !password || !ownerName || !businessName) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    let latitude = 0,
      longitude = 0;
    try {
      const coordinates = await getCoordinatesFromAddress(
        `${streetaddress}, ${city}, ${state}, ${country}`
      );
      latitude = coordinates.latitude;
      longitude = coordinates.longitude;
    } catch (error) {
      console.error("Geocoding error:", error);
      res
        .status(400)
        .json({ error: "Invalid address. Unable to fetch coordinates." });
      return;
    }
    console.log("Coordinates:", latitude, longitude);

    // Store documents and photos URLs for cleanup in case of error
    documentsToDelete = documents || [];
    photosToDelete = imageUrls || [];
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(tags);
    // Extract uploaded file URLs
    // Handle Tags: Create or Connect
    const tagConnections = (tags || []).map((tag: string) => ({
      where: { name: tag.trim() },
      create: {
        name: tag.trim(),
      },
    }));

    // Create a new business entry
    const business = await prisma.business.create({
      data: {
        email,
        password: hashedPassword,
        ownerName,
        businessName,
        description: description || null,
        phoneNumber: phoneNumber || null,
        category: category || null,
        features: features || [],
        timing: timing ? timing : null,
        streetaddress: streetaddress || null,
        city: city || null,
        country: country || null,
        zipcode: zipcode || null,
        state: state || null,
        address: `${streetaddress}, ${city}, ${state}, ${country}`,
        websiteUrl: websiteUrl || null,
        documents: documents || [], // Assuming documents is an array of URLs
        imageUrls: imageUrls || [], // Assuming photos is an array of URLs
        isOpen: true,
        longitude: latitude,
        latitude: longitude,
        isVerified: false,
        tags: {
          connectOrCreate: tagConnections,
        },
      },
    });

    // Generate a JWT token
    const token = jwt.sign({ id: business.id }, JWT_SECRET, {
      expiresIn: "1h",
    });
    await sendEmail(
      email,
      "Welcome to Apneyy",
      `Hello ${ownerName},\n\nWelcome to Apneyy! We are excited to have you on board.\n\n We are currently verifying your application.\n We will send update under 48 hours \n\nBest,\nTeam Apneyy`
    );
    // Respond with created business and token
    res.status(201).json({ business, token });
  } catch (error: unknown) {
    // Cleanup documents and photos if registration fails
    // Cleanup documents and photos if registration fails
    for (const docUrl of documentsToDelete) {
      await deleteFileFromS3(docUrl);
    }

    for (const photoUrl of photosToDelete) {
      await deleteFileFromS3(photoUrl);
    }
    if (error instanceof Error) {
      if ((error as any).code === "P2002") {
        res
          .status(400)
          .json({ error: "Business email or name already exists" });
        return;
      }
      res.status(500).json({
        error: "Error creating business account",
        details: error.message,
      });
      return;
    }
    console.log(error);
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

    const business = await prisma.business.findUnique({ where: { email }, include: { subscriptions: true } });
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

// **Admin Sign-up**
export const registerAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      userId,
      password,
      accessUser,
      accessVendor,
      accessAnalytics,
      accessReports,
      accessMarket,
    } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.adminRole.create({
      data: {
        userId,
        password: hashedPassword,
        accessUser: accessUser || false,
        accessVendor: accessVendor || false,
        accessAnalytics: accessAnalytics || false,
        accessReports: accessReports || false,
        accessMarket: accessMarket || false,
      },
    });

    const token = jwt.sign({ id: admin.id }, JWT_SECRET, { expiresIn: "1h" });

    const { password: _, ...adminWithoutPassword } = admin;
    res.status(201).json({ admin: adminWithoutPassword, token });

    return;
  } catch (error: unknown) {
    if (error instanceof Error) {
      if ((error as any).code === "P2002") {
        res
          .status(400)
          .json({ error: "Admin userId already exists or is not unique" });
        return;
      }
      res.status(500).json({
        error: "Error creating admin account",
        details: error.message,
      });
      return;
    }
    res.status(500).json({ error: "Unknown error occurred" });
    return;
  }
};

// **Admin Sign-in**
export const loginAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId, password } = req.body;

    const admin = await prisma.adminRole.findUnique({
      where: { userId: userId },
    });

    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      res.status(401).json({ error: "Invalid userId or password" });
      return;
    }

    const token = jwt.sign({ id: admin.id }, JWT_SECRET, { expiresIn: "1h" });

    const { password: _, ...adminWithoutPassword } = admin;
    res.status(200).json({ admin: adminWithoutPassword, token });

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

// **Delete Admin**
export const deleteAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ error: "Admin userId is required" });
      return;
    }

    // Check if the admin exists
    const admin = await prisma.adminRole.findUnique({
      where: { userId },
    });

    if (!admin) {
      res.status(404).json({ error: "Admin not found" });
      return;
    }

    // Delete the admin
    await prisma.adminRole.delete({
      where: { userId },
    });

    res.status(200).json({ message: "Admin deleted successfully" });
    return;
  } catch (error: unknown) {
    if (error instanceof Error) {
      res
        .status(500)
        .json({ error: "Failed to delete admin", details: error.message });
      return;
    }
    res.status(500).json({ error: "Unknown error occurred" });
    return;
  }
};
