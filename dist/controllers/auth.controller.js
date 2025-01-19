"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.businessLogin = exports.businessRegister = exports.login = exports.register = void 0;
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
}
// **User Sign-up**
const register = async (req, res) => {
    try {
        const { email, password, name, phone, occupation, otherOccupation } = req.body;
        console.log(req.body);
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
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
        const token = jsonwebtoken_1.default.sign({ id: user.id }, JWT_SECRET, { expiresIn: "1h" });
        // res.status(201).json({ user, token });
        const { password: _, ...userWithoutPassword } = user;
        res.status(201).json({ user: userWithoutPassword, token });
        return; // Ensures that the function returns `void`
    }
    catch (error) {
        if (error instanceof Error) {
            if (error.code === "P2002") {
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
exports.register = register;
// **User Sign-in**
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !(await bcrypt_1.default.compare(password, user.password))) {
            res.status(401).json({ error: "Invalid email or password" });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id }, JWT_SECRET, { expiresIn: "1h" });
        const { password: _, ...userWithoutPassword } = user;
        res.status(201).json({ user: userWithoutPassword, token });
        return;
    }
    catch (error) {
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
exports.login = login;
// **Business Sign-up**
const businessRegister = async (req, res) => {
    try {
        const { email, password, ownerName, businessName, description, address, phoneNumber, longitude, latitude, category, tags, features, timing, keywords, // Expect an array of keywords (e.g., ["Bakery", "Gym"])
        streetaddress, city, country, zipcode, state, websiteUrl, documents, } = req.body;
        // Hash password
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        // Create or connect keywords
        const keywordConnections = (keywords || []).map((keyword) => ({
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
        const token = jsonwebtoken_1.default.sign({ id: business.id }, JWT_SECRET, {
            expiresIn: "1h",
        });
        // Respond with created business and token
        res.status(201).json({ business, token });
    }
    catch (error) {
        if (error instanceof Error) {
            if (error.code === "P2002") {
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
exports.businessRegister = businessRegister;
// **Business Sign-in**
const businessLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const business = await prisma.business.findUnique({ where: { email } });
        if (!business?.password) {
            res.status(401).json({ error: "Business not found" });
            return;
        }
        if (!business || !(await bcrypt_1.default.compare(password, business.password))) {
            res.status(401).json({ error: "Invalid email or password" });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: business.id }, JWT_SECRET, {
            expiresIn: "1h",
        });
        res.json({ business, token });
        return;
    }
    catch (error) {
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
exports.businessLogin = businessLogin;
