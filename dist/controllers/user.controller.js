"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.getUserReviews = exports.postReview = exports.getFavorites = exports.removeFavorite = exports.addFavorite = void 0;
const client_1 = require("@prisma/client");
const redis_1 = require("../config/redis");
const prisma = new client_1.PrismaClient();
// **Add a Business to Favorites (Update both `User` and `Business`)**
const addFavorite = async (req, res) => {
    try {
        const { userId, businessId } = req.body;
        await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: {
                    favorites: {
                        connect: { id: businessId },
                    },
                },
            }),
            prisma.business.update({
                where: { id: businessId },
                data: {
                    favoritedBy: {
                        connect: { id: userId },
                    },
                },
            }),
        ]);
        res.status(200).json({ message: "Business added to favorites" });
    }
    catch (error) {
        res.status(500).json({
            error: "Failed to add favorite",
            details: error.message,
        });
    }
};
exports.addFavorite = addFavorite;
// **Remove a Business from Favorites (Update both `User` and `Business`)**
const removeFavorite = async (req, res) => {
    try {
        const { userId, businessId } = req.body;
        await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: {
                    favorites: {
                        disconnect: { id: businessId },
                    },
                },
            }),
            prisma.business.update({
                where: { id: businessId },
                data: {
                    favoritedBy: {
                        disconnect: { id: userId },
                    },
                },
            }),
        ]);
        res.status(200).json({ message: "Business removed from favorites" });
    }
    catch (error) {
        res.status(500).json({
            error: "Failed to remove favorite",
            details: error.message,
        });
    }
};
exports.removeFavorite = removeFavorite;
// **Get User's Favorite Businesses**
const getFavorites = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                favorites: true, // Fetch favorite businesses from the user's relation
            },
        });
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.status(200).json(user.favorites);
    }
    catch (error) {
        res.status(500).json({
            error: "Failed to retrieve favorites",
            details: error.message,
        });
    }
};
exports.getFavorites = getFavorites;
const postReview = async (req, res) => {
    try {
        const { userId, businessId, content, aspects, imageUrl } = req.body;
        console.log(req.body);
        // Validate incoming request data
        if (!userId ||
            !businessId ||
            !content ||
            !aspects ||
            !Array.isArray(aspects)) {
            res.status(400).json({
                error: "All fields (userId, businessId, content, and aspects) are required, and aspects must be an array.",
            });
            return;
        }
        // Validate `content` (ensure it's not an empty string)
        if (typeof content !== "string" || content.trim() === "") {
            res.status(400).json({
                error: "Content must be a non-empty string.",
            });
            return;
        }
        console.log(aspects);
        // Ensure each aspect has both `aspect` and `rating`, and ratings are within valid range
        for (const aspect of aspects) {
            if (!aspect.aspect || typeof aspect.aspect !== "string") {
                res.status(400).json({
                    error: "Each aspect must have a valid 'aspect' name (string).",
                });
                return;
            }
            if (!Number.isInteger(aspect.rating) || // Ensure the rating is an integer
                aspect.rating < 1 ||
                aspect.rating > 5) {
                res.status(400).json({
                    error: "Each aspect's rating must be an integer between 1 and 5.",
                });
                return;
            }
        }
        // Calculate overall average rating
        const overallRating = Math.round(aspects.reduce((sum, aspect) => sum + aspect.rating, 0) / aspects.length);
        // Create the review in the database
        const review = await prisma.review.create({
            data: {
                content,
                rating: overallRating, // Save the calculated average rating
                userId,
                businessId,
                aspects: aspects, // Save aspects as JSON
                image: imageUrl,
            },
        });
        const cacheKey = `business:${businessId}`; // Unique cache key for this business
        await redis_1.redisClient.del(cacheKey);
        await redis_1.redisClient.del("nonVerifiedReviews");
        res.status(201).json({
            message: "Review posted successfully",
            review,
        });
    }
    catch (error) {
        console.error("Error in postReview:", error); // Log the error for debugging
        res.status(500).json({
            error: "Failed to post review",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.postReview = postReview;
// **Get User's Reviews**
const getUserReviews = async (req, res) => {
    try {
        const { userId } = req.body;
        // Validate incoming request data
        if (!userId) {
            res.status(400).json({ error: "userId is required" });
            return;
        }
        const reviews = await prisma.review.findMany({
            where: { userId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                    },
                },
            },
        });
        if (reviews.length === 0) {
            res.status(404).json({ message: "No reviews found for this user" });
            return;
        }
        res.status(200).json(reviews);
    }
    catch (error) {
        res.status(500).json({
            error: "Failed to get reviews",
            details: error.message,
        });
    }
};
exports.getUserReviews = getUserReviews;
const deleteUser = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            res.status(400).json({ error: "User ID is required" });
            return;
        }
        const deletedUser = await prisma.user.delete({
            where: { id: userId },
        });
        res.status(200).json({ message: "User deleted successfully", deletedUser });
    }
    catch (error) {
        res.status(500).json({
            error: "Failed to delete user",
            details: error.message,
        });
    }
};
exports.deleteUser = deleteUser;
