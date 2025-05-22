"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllSuggestions = exports.updateTaskStatus = exports.getTasksForAdmin = exports.createTask = exports.listAllReviewsNoPagination = exports.listAllBusinessesNoPagination = exports.fetchNotifications = exports.listLatestActivities = exports.listImageBusinesses = exports.updateImageStatus = exports.getTopBusinessesByViews = exports.fetchReviews = exports.updateReviewStatus = exports.sendEmailsToRecipients = exports.listAllBusinesses = exports.listAdmins = exports.getTopItems = exports.editBusiness = exports.listBusinesses = exports.listUsers = exports.getTotalViewsByDay = exports.deleteUser = exports.deleteBusiness = exports.verifyBusiness = exports.getBusinessCreatedCountByDay = exports.getUserCreatedCountByDay = void 0;
const client_1 = require("@prisma/client");
const redis_1 = require("../config/redis");
const mail_1 = require("../utils/mail");
const activity_1 = require("../utils/activity");
const IDCreation_1 = require("../utils/IDCreation");
const prisma = new client_1.PrismaClient();
// **Get User Created Count by Day with Caching**
const getUserCreatedCountByDay = async (req, res) => {
    try {
        // Define a cache key based on the query (this could be dynamic based on query params, etc.)
        const cacheKey = "userCreatedCountByDay";
        // Check if cached data exists
        const cachedData = await redis_1.redisClient.get(cacheKey);
        if (cachedData) {
            // If cached data exists, return it as a response
            res.status(200).json(JSON.parse(cachedData));
            return;
        }
        // If no cache, proceed to fetch from the database
        const usersCountByDay = await prisma.$queryRaw `
      SELECT
        DATE("createdAt") AS date,
        COUNT(id) AS count
      FROM "User"
      GROUP BY DATE("createdAt")
      ORDER BY DATE("createdAt") ASC;
    `;
        const totalUsers = await prisma.user.count();
        const formattedData = usersCountByDay.map((item) => ({
            date: item.date.toISOString().split("T")[0],
            count: item.count.toString(),
        }));
        const responseData = {
            totalUsers: totalUsers.toString(),
            usersByDay: formattedData,
        };
        // Cache the data with an expiration time (e.g., 1 hour)
        await redis_1.redisClient.setex(cacheKey, 3600, JSON.stringify(responseData)); // 3600 seconds = 1 hour
        // Return the data
        res.status(200).json(responseData);
    }
    catch (error) {
        res.status(500).json({
            error: "Failed to fetch user created count",
            details: error.message,
        });
    }
};
exports.getUserCreatedCountByDay = getUserCreatedCountByDay;
// **Get Business Created Count by Day with Caching**
const getBusinessCreatedCountByDay = async (req, res) => {
    try {
        // Define a cache key based on the query (this could be dynamic based on query params, etc.)
        const cacheKey = "businessCreatedCountByDay";
        // Check if cached data exists
        const cachedData = await redis_1.redisClient.get(cacheKey);
        // if (cachedData) {
        //   // If cached data exists, return it as a response
        //   res.status(200).json(JSON.parse(cachedData));
        //   return;
        // }
        // If no cache, proceed to fetch from the database
        const businessCountByDay = await prisma.$queryRaw `
      SELECT
        DATE("createdAt") AS date,
        COUNT(id) AS count
      FROM "Business"
      WHERE "email" IS NOT NULL
      GROUP BY DATE("createdAt")
      ORDER BY DATE("createdAt") ASC;
    `;
        const totalBusiness = await prisma.business.count({
            where: { email: { not: null } },
        });
        const formattedData = businessCountByDay.map((item) => ({
            date: item.date.toISOString().split("T")[0],
            count: item.count.toString(),
        }));
        const responseData = {
            totalBusinesses: totalBusiness.toString(),
            businessesByDay: formattedData,
        };
        // Cache the data with an expiration time (e.g., 1 hour)
        await redis_1.redisClient.setex(cacheKey, 3600, JSON.stringify(responseData)); // 3600 seconds = 1 hour
        // Return the data
        res.status(200).json(responseData);
    }
    catch (error) {
        res.status(500).json({
            error: "Failed to fetch business created count",
            details: error.message,
        });
    }
};
exports.getBusinessCreatedCountByDay = getBusinessCreatedCountByDay;
// **Mark Business as Verified**
const verifyBusiness = async (req, res) => {
    try {
        const { businessId, adminId } = req.body;
        if (!businessId) {
            res.status(400).json({ error: "Business ID is required" });
            return;
        }
        const business = await prisma.business.findUnique({
            where: { id: businessId },
        });
        if (!business) {
            res.status(404).json({ error: "Business not found" });
            return;
        }
        const generatedBusinessId = await (0, IDCreation_1.generateBusinessId)(business.ownerName || "", business.city || "");
        const updatedBusiness = await prisma.business.update({
            where: { id: businessId },
            data: { isVerified: true, businessId: generatedBusinessId },
        });
        if (updatedBusiness.email) {
            (0, mail_1.sendEmail)(updatedBusiness.email, "Your Business has been approved!", "Your business has been approved. You can now access your dashboard.");
        }
        (0, activity_1.createActivity)("Verified Business", `Admin ${adminId} approved business "${updatedBusiness.businessName}" (ID: ${updatedBusiness.id})`);
        res
            .status(200)
            .json({ message: "Business verified successfully", updatedBusiness });
    }
    catch (error) {
        res.status(500).json({
            error: "Failed to verify business",
            details: error.message,
        });
    }
};
exports.verifyBusiness = verifyBusiness;
/**
 * Deletes a business and logs the activity.
 */
const deleteBusiness = async (req, res) => {
    try {
        const { businessId, adminId } = req.body;
        // Validate required fields
        if (!businessId || !adminId) {
            res.status(400).json({ error: "Business ID and Admin ID are required" });
            return;
        }
        // Fetch business details before deleting
        const business = await prisma.business.findUnique({
            where: { id: businessId },
        });
        if (!business) {
            res.status(404).json({ error: "Business not found" });
            return;
        }
        // Delete the business
        const deletedBusiness = await prisma.business.delete({
            where: { id: businessId },
        });
        // Log the admin activity
        await (0, activity_1.createActivity)("Business Deletion", `Admin ${adminId} deleted business "${business.businessName}" (ID: ${business.id})`);
        res
            .status(200)
            .json({ message: "Business deleted successfully", deletedBusiness });
    }
    catch (error) {
        console.error("Error deleting business:", error);
        res.status(500).json({
            error: "Failed to delete business",
            details: error.message,
        });
    }
};
exports.deleteBusiness = deleteBusiness;
/**
 * Deletes a user and logs the admin activity.
 */
const deleteUser = async (req, res) => {
    try {
        const { userId, adminId } = req.body;
        // Validate required fields
        if (!userId || !adminId) {
            res.status(400).json({ error: "User ID and Admin ID are required" });
            return;
        }
        // Fetch user details before deleting
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        // Delete the user
        const deletedUser = await prisma.user.delete({
            where: { id: userId },
        });
        // Log the admin activity
        await (0, activity_1.createActivity)("User Deletion", `Admin ${adminId} deleted user "${user.name + " - " + user.email}" (ID: ${user.id})`);
        res.status(200).json({ message: "User deleted successfully", deletedUser });
    }
    catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({
            error: "Failed to delete user",
            details: error.message,
        });
    }
};
exports.deleteUser = deleteUser;
// **Get Total Views of All Businesses (Daywise Analytics)**
const getTotalViewsByDay = async (req, res) => {
    const cacheKey = "totalViewsByDay"; // Unique cache key
    try {
        // Check if data is available in Redis cache
        const cachedData = await redis_1.redisClient.get(cacheKey);
        if (cachedData) {
            // If cached data exists, parse and return it
            console.log("Cache hit");
            res.status(200).json(JSON.parse(cachedData));
            return;
        }
        // If not in cache, fetch from database
        console.log("Cache miss");
        const totalViewsByDay = await prisma.viewInteraction.groupBy({
            by: ["date"],
            _sum: {
                views: true,
            },
            orderBy: {
                date: "asc",
            },
        });
        // Calculate total views of all time
        const totalViews = totalViewsByDay.reduce((sum, record) => sum + (record._sum.views || 0), 0);
        // Format the response data
        const formattedData = totalViewsByDay.map((record) => ({
            date: record.date.toISOString().split("T")[0],
            views: record._sum.views || 0,
        }));
        // Prepare the response object
        const responseData = {
            totalViews,
            viewsByDay: formattedData,
        };
        // Cache the data in Redis for 1 hour (60 minutes * 60 seconds)
        await redis_1.redisClient.setex(cacheKey, 3600, JSON.stringify(responseData));
        // Send the response
        res.status(200).json(responseData); // Corrected return type issue
    }
    catch (error) {
        res.status(500).json({
            error: "Failed to fetch total views",
            details: error.message,
        });
    }
};
exports.getTotalViewsByDay = getTotalViewsByDay;
// **List Users with limited info**
const listUsers = async (req, res) => {
    const cacheKey = "users";
    try {
        // const cachedData = await redisClient.get(cacheKey);
        // if (cachedData) {
        //   console.log("Cache hit for listUsers");
        //   res.status(200).json(JSON.parse(cachedData));
        //   return;
        // }
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                occupation: true,
                otherOccupation: true,
                email: true,
                phone: true
            },
        });
        // Cache the data in Redis for 1 hour
        await redis_1.redisClient.setex(cacheKey, 3600, JSON.stringify({ success: true, data: users }));
        res.status(200).json({
            success: true,
            data: users,
        });
    }
    catch (error) {
        res.status(500).json({
            error: "Failed to fetch users",
            details: error.message,
        });
    }
};
exports.listUsers = listUsers;
// **List Businesses with limited info**
const listBusinesses = async (req, res) => {
    try {
        const businesses = await prisma.business.findMany({
            where: { email: { not: null } },
            select: {
                id: true,
                businessName: true,
                city: true,
                state: true,
                email: true,
                features: true,
                category: true,
                subcategory: true,
                phoneNumber: true,
                ownerName: true,
                isVerified: true,
                hasApplied: true,
                documents: true,
                imageUrls: true,
                address: true,
                createdAt: true,
                businessId: true,
                tags: {
                    select: {
                        name: true
                    }
                }
            },
        });
        console.log(businesses);
        // Cache the data in Redis for 1 hour
        res.status(200).json({
            success: true,
            data: businesses,
        });
    }
    catch (error) {
        res.status(500).json({
            error: "Failed to fetch businesses",
            details: error.message,
        });
    }
};
exports.listBusinesses = listBusinesses;
const editBusiness = async (req, res) => {
    try {
        // Destructure id and tags from request body along with the rest of the update data.
        // The rest of the fields (updateData) will be used for updating the business.
        const { id, tags, email, phoneNumber, ...updateData } = req.body;
        // Even if email and phoneNumber are sent, ensure they are not updated.
        // You could also delete them explicitly if they exist.
        // delete updateData.email;
        // delete updateData.phoneNumber;
        // If updating tags (a many-to-many relation), use a nested write.
        // This example assumes that each tag is passed as an object with a `name` property,
        // and that the tags already exist. Adjust as needed for your use-case.
        if (tags) {
            updateData.tags = {
                set: tags.map((tag) => ({ name: tag.name })),
            };
        }
        const updatedBusiness = await prisma.business.update({
            where: { id: Number(id) },
            data: updateData,
            select: {
                id: true,
                businessName: true,
                city: true,
                state: true,
                email: true, // remains unchanged
                features: true,
                category: true,
                subcategory: true,
                phoneNumber: true, // remains unchanged
                ownerName: true,
                isVerified: true,
                hasApplied: true,
                documents: true,
                imageUrls: true,
                address: true,
                createdAt: true,
                businessId: true,
                tags: {
                    select: {
                        name: true,
                    },
                },
            },
        });
        res.status(200).json({
            success: true,
            data: updatedBusiness,
        });
    }
    catch (error) {
        res.status(500).json({
            error: "Failed to update business",
            details: error.message,
        });
    }
};
exports.editBusiness = editBusiness;
const getTopItems = async (req, res) => {
    const cacheKey = "topItems"; // Unique cache key for top items
    try {
        // Check if data is available in Redis cache
        const cachedData = await redis_1.redisClient.get(cacheKey);
        if (cachedData) {
            console.log("Cache hit for top items");
            res.status(200).json(JSON.parse(cachedData));
            return;
        }
        // Fetch top 10 items from the database
        const topItems = await prisma.itemSearch.findMany({
            select: { item: true, count: true }, // Select only item and count
            orderBy: { count: "desc" },
            take: 10, // Limit to top 10 items
        });
        // Format the response
        const responseData = topItems.map((item) => ({
            name: item.item,
            count: item.count,
        }));
        // Cache the data in Redis for 1 hour
        await redis_1.redisClient.setex(cacheKey, 3600, JSON.stringify(responseData));
        // Return the response
        res.status(200).json(responseData);
    }
    catch (error) {
        res.status(500).json({
            error: "Failed to fetch top items",
            details: error.message,
        });
    }
};
exports.getTopItems = getTopItems;
// **List All Admins**
const listAdmins = async (req, res) => {
    try {
        // Fetch all admins from the database
        const admins = await prisma.adminRole.findMany({
            select: {
                id: true,
                userId: true,
                accessUser: true,
                accessVendor: true,
                accessAnalytics: true,
                accessReports: true,
                accessMarket: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        // Return the list of admins
        res.status(200).json({
            success: true,
            data: admins,
        });
    }
    catch (error) {
        console.error("Error fetching admins:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch admins.",
            details: error.message,
        });
    }
};
exports.listAdmins = listAdmins;
const listAllBusinesses = async (req, res) => {
    try {
        const { page = 1, limit = 10, category, city } = req.query; // Default to page 1 and limit 10
        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);
        // Calculate the offset for pagination
        const offset = (pageNumber - 1) * limitNumber;
        // Build the filter object dynamically
        const filters = {};
        if (city) {
            filters.city = city;
        }
        if (category) {
            filters.category = category;
        }
        // Fetch businesses with pagination and filtering
        const businesses = await prisma.business.findMany({
            where: filters, // Apply filters
            select: {
                id: true,
                businessName: true,
                city: true,
                category: true,
                state: true,
                businessId: true,
                phoneNumber: true,
                zipcode: true,
            },
            skip: offset,
            take: limitNumber,
        });
        // Fetch the total count of filtered businesses
        const totalBusinesses = await prisma.business.count({
            where: filters,
        });
        // Calculate total pages
        const totalPages = Math.ceil(totalBusinesses / limitNumber);
        // Send response
        res.status(200).json({
            success: true,
            data: businesses,
            pagination: {
                currentPage: pageNumber,
                totalPages,
                totalBusinesses,
                limit: limitNumber,
            },
        });
    }
    catch (error) {
        console.error("Error fetching businesses:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch businesses",
        });
    }
};
exports.listAllBusinesses = listAllBusinesses;
const sendEmailsToRecipients = async (req, res) => {
    const { subject, message, recipients } = req.body;
    if (!subject || !message || !recipients || !Array.isArray(recipients)) {
        res.status(400).json({
            error: "Invalid request body. Ensure all required fields are provided.",
        });
        return;
    }
    try {
        const emailPromises = recipients.map((recipient) => {
            const personalizedMessage = `Dear ${recipient.name},\n\n${message}`;
            return (0, mail_1.sendEmail)(recipient.email, subject, personalizedMessage);
        });
        // Wait for all email promises to resolve
        await Promise.all(emailPromises);
        res
            .status(200)
            .json({ success: true, message: "Emails sent successfully!" });
    }
    catch (error) {
        console.error("Error sending emails:", error);
        res.status(500).json({ error: "Failed to send emails." });
    }
};
exports.sendEmailsToRecipients = sendEmailsToRecipients;
/**
 * Approve or Delete a review.
 */
const updateReviewStatus = async (req, res) => {
    try {
        const { reviewId, action, adminId } = req.body;
        // Validate required fields
        if (!reviewId || !action || !adminId) {
            res
                .status(400)
                .json({ error: "Review ID, action, and admin ID are required." });
            return;
        }
        // Validate action
        if (!["approve", "delete"].includes(action)) {
            res
                .status(400)
                .json({ error: "Invalid action. Use 'approve' or 'delete'." });
            return;
        }
        // Fetch review before updating/deleting
        const review = await prisma.review.findUnique({ where: { id: reviewId } });
        if (!review) {
            res.status(404).json({ error: "Review not found." });
            return;
        }
        let result;
        if (action === "approve") {
            result = await prisma.review.update({
                where: { id: reviewId },
                data: { isVerified: true },
            });
            // Log activity
            await (0, activity_1.createActivity)("Review Approved", `Admin ${adminId} approved review (ID: ${reviewId})`);
        }
        else if (action === "delete") {
            result = await prisma.review.delete({
                where: { id: reviewId },
            });
            // Log activity
            await (0, activity_1.createActivity)("Review Deleted", `Admin ${adminId} deleted review (ID: ${reviewId})`);
        }
        // Clear Redis cache (if Redis is enabled)
        if (redis_1.redisClient) {
            await redis_1.redisClient.del("verifiedReviews");
            await redis_1.redisClient.del("nonVerifiedReviews");
        }
        res.status(200).json({
            success: true,
            message: `Review ${action === "approve" ? "approved" : "deleted"} successfully.`,
            result,
        });
    }
    catch (error) {
        console.error("Error updating review status:", error);
        res.status(500).json({
            error: "Failed to update review status.",
            details: error.message,
        });
    }
};
exports.updateReviewStatus = updateReviewStatus;
/**
 * Fetch verified and non-verified reviews
 */
const fetchReviews = async (req, res) => {
    const { isVerified } = req.query; // Expect a boolean value: true for verified, false for non-verified
    const cacheKey = isVerified === "true" ? "verifiedReviews" : "nonVerifiedReviews";
    try {
        // Check if data exists in Redis cache
        // Fetch reviews based on verification status
        const reviews = await prisma.review.findMany({
            where: { isVerified: isVerified === "true" },
            select: {
                id: true,
                content: true,
                rating: true,
                aspects: true,
                image: true,
                createdAt: true,
                user: { select: { id: true, name: true, email: true, avatar: true } },
                business: { select: { id: true, businessName: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        res.status(200).json({
            success: true,
            data: reviews,
        });
    }
    catch (error) {
        res.status(500).json({
            error: "Failed to fetch reviews.",
            details: error.message,
        });
    }
};
exports.fetchReviews = fetchReviews;
// **Get Top 10 Businesses by Views (with Caching)**
const getTopBusinessesByViews = async (req, res) => {
    const cacheKey = "topBusinessesByViews"; // Cache key
    const cacheTime = 4 * 60 * 60; // 12 hours (43200 seconds)
    try {
        // Check Redis cache first
        const cachedData = await redis_1.redisClient.get(cacheKey);
        if (cachedData) {
            console.log("Cache hit for top businesses by views");
            res.status(200).json(JSON.parse(cachedData));
            return;
        }
        // If not cached, fetch from the database
        console.log("Cache miss for top businesses by views");
        const topBusinesses = await prisma.viewInteraction.groupBy({
            by: ["businessId"],
            _sum: { views: true },
            orderBy: { _sum: { views: "desc" } },
            take: 10, // Limit to top 10
        });
        // Fetch business names
        const businessesWithDetails = await prisma.business.findMany({
            where: { id: { in: topBusinesses.map((b) => b.businessId) } },
            select: {
                id: true,
                businessName: true,
            },
        });
        // Merge views data with business details
        const responseData = topBusinesses.map((business) => ({
            id: business.businessId,
            businessName: businessesWithDetails.find((b) => b.id === business.businessId)
                ?.businessName || "Unknown",
            views: business._sum.views || 0,
        }));
        // Store result in Redis cache
        await redis_1.redisClient.setex(cacheKey, cacheTime, JSON.stringify(responseData));
        // Send response
        res.status(200).json(responseData);
    }
    catch (error) {
        console.error("Error fetching top businesses by views:", error);
        res.status(500).json({
            error: "Failed to fetch top businesses by views",
            details: error.message,
        });
    }
};
exports.getTopBusinessesByViews = getTopBusinessesByViews;
/**
 * Approve or Reject a business image
 */
const updateImageStatus = async (req, res) => {
    try {
        const { businessId, action, adminId } = req.body;
        // Validate required fields
        if (!businessId || !action || !adminId) {
            res
                .status(400)
                .json({ error: "Business ID, action, and admin ID are required" });
            return;
        }
        // Validate action
        if (!["verify", "reject"].includes(action)) {
            res
                .status(400)
                .json({ error: "Invalid action. Use 'verify' or 'reject'." });
            return;
        }
        // Fetch business before updating
        const business = await prisma.business.findUnique({
            where: { id: businessId },
        });
        if (!business) {
            res.status(404).json({ error: "Business not found" });
            return;
        }
        if (action === "verify") {
            const updatedBusiness = await prisma.business.update({
                where: { id: businessId },
                data: { isImageUpdated: false, isVerified: true }, // ✅ Corrected to keep the image verified
            });
            business.email &&
                (0, mail_1.sendEmail)(business.email, "Image Verified", "Your image has been verified.");
            // Log activity
            await (0, activity_1.createActivity)("Image Verified", `Admin ${adminId} verified the image for business "${business.businessName}" (ID: ${business.id})`);
            res.status(200).json({
                message: "Image verified successfully",
                business: updatedBusiness,
            });
            return;
        }
        if (action === "reject") {
            if (!business.email) {
                res.status(400).json({ error: "Business email not found" });
                return;
            }
            const subject = "Image Verification Failed";
            const text = `
        Dear ${business.ownerName || "Business Owner"},

        Your uploaded image for your business "${business.businessName}" has not been verified. 

        Please ensure that your image meets the required guidelines and try uploading again.

        Thank you,
        Apneyy Team
      `;
            await (0, mail_1.sendEmail)(business.email, subject, text);
            // Log activity
            await (0, activity_1.createActivity)("Image Rejected", `Admin ${adminId} rejected the image for business "${business.businessName}" (ID: ${business.id})`);
            res.status(200).json({
                message: "Image not verified. Email sent to business owner.",
            });
            return;
        }
    }
    catch (error) {
        console.error("Error updating image status:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.updateImageStatus = updateImageStatus;
const listImageBusinesses = async (req, res) => {
    try {
        const businesses = await prisma.business.findMany({
            where: { isImageUpdated: true },
            select: {
                id: true,
                businessName: true,
                city: true,
                state: true,
                email: true,
                phoneNumber: true,
                ownerName: true,
                isVerified: true,
                hasApplied: true,
                documents: true,
                imageUrls: true,
                address: true,
            },
        });
        console.log("Fetched businesses from database:", businesses);
        // Cache the data in Redis for 1 hour (3600 seconds)
        res.status(200).json({
            success: true,
            data: businesses,
        });
    }
    catch (error) {
        console.error("Error fetching verified businesses:", error);
        res.status(500).json({
            error: "Failed to fetch verified businesses",
            details: error.message,
        });
    }
};
exports.listImageBusinesses = listImageBusinesses;
const listLatestActivities = async (req, res) => {
    try {
        const activities = await prisma.activity.findMany({
            orderBy: { createdAt: "desc" }, // Sort by newest first
            take: 10, // Limit to 10 activities
            select: {
                id: true,
                name: true,
                text: true,
                createdAt: true,
            },
        });
        res.status(200).json({ success: true, activities });
    }
    catch (error) {
        console.error("Error fetching activities:", error);
        res.status(500).json({
            error: "Failed to fetch activities",
            details: error.message,
        });
    }
};
exports.listLatestActivities = listLatestActivities;
const fetchNotifications = async (req, res) => {
    try {
        // Get today's start time (00:00:00)
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        // Fetch counts for today's records
        const businessesCreated = await prisma.business.count({
            where: { createdAt: { gte: todayStart } },
        });
        const usersRegistered = await prisma.user.count({
            where: { createdAt: { gte: todayStart } },
        });
        const reviewsReceived = await prisma.review.count({
            where: { createdAt: { gte: todayStart } },
        });
        // Send response
        res.status(200).json({
            businessesCreated,
            usersRegistered,
            reviewsReceived,
        });
    }
    catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({
            error: "Failed to fetch notification data",
            details: error.message,
        });
    }
};
exports.fetchNotifications = fetchNotifications;
const listAllBusinessesNoPagination = async (req, res) => {
    try {
        // Extract query parameters for filtering (all are optional)
        const { category, city, state, isVerified, fromDate, toDate } = req.query;
        // Build the filter object dynamically
        const filters = {};
        if (city) {
            filters.city = city;
        }
        if (category) {
            filters.category = category;
        }
        if (state) {
            filters.state = state;
        }
        if (isVerified) {
            // Convert the query parameter to a boolean
            filters.isVerified = isVerified === "true";
        }
        if (fromDate && toDate) {
            const from = new Date(fromDate);
            const to = new Date(toDate);
            // Adjust the "to" date to include the entire day
            to.setHours(23, 59, 59, 999);
            filters.createdAt = {
                gte: from,
                lte: to,
            };
        }
        // Fetch all businesses matching the filters (without pagination)
        const businesses = await prisma.business.findMany({
            where: filters,
            select: {
                id: true,
                ownerName: true,
                email: true,
                businessName: true,
                password: true, // Be cautious about returning sensitive fields (e.g., password)
                businessId: true,
                address: true,
                longitude: true,
                latitude: true,
                rating: true,
                // imageUrls is excluded
                isOpen: true,
                isVerified: true,
                description: true,
                phoneNumber: true,
                websiteUrl: true,
                createdAt: true,
                updatedAt: true,
                city: true,
                country: true,
                streetaddress: true,
                state: true,
                zipcode: true,
                category: true,
            },
        });
        // Return the result as JSON
        res.status(200).json({
            success: true,
            data: businesses,
        });
    }
    catch (error) {
        console.error("Error fetching businesses:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch businesses",
        });
    }
};
exports.listAllBusinessesNoPagination = listAllBusinessesNoPagination;
const listAllReviewsNoPagination = async (req, res) => {
    try {
        // Extract query parameters (all optional)
        const { isVerified, minRating, maxRating, fromDate, toDate } = req.query;
        // Build the filter object dynamically
        const filters = {};
        if (isVerified) {
            // Convert the query string to a boolean
            filters.isVerified = isVerified === "true";
        }
        if (minRating || maxRating) {
            filters.rating = {};
            if (minRating) {
                filters.rating.gte = parseInt(minRating, 10);
            }
            if (maxRating) {
                filters.rating.lte = parseInt(maxRating, 10);
            }
        }
        if (fromDate && toDate) {
            const from = new Date(fromDate);
            const to = new Date(toDate);
            // Adjust "to" date to include the entire day
            to.setHours(23, 59, 59, 999);
            filters.createdAt = {
                gte: from,
                lte: to,
            };
        }
        // Fetch all reviews matching the filters (without pagination)
        // Fetch all reviews matching the filters along with related user and business data.
        const reviews = await prisma.review.findMany({
            where: filters,
            include: {
                user: {
                    select: {
                        name: true, // Fetch username
                    },
                },
                business: {
                    select: {
                        id: true, // Business ID
                        businessName: true, // Business Name
                    },
                },
            },
        });
        // Flatten the response so that the related fields appear at the top level.
        const flattenedReviews = reviews.map((review) => ({
            id: review.id,
            content: review.content,
            rating: review.rating,
            createdAt: review.createdAt,
            isVerified: review.isVerified,
            userId: review.userId,
            businessId: review.businessId,
            username: review.user?.name,
            businessName: review.business?.businessName,
        }));
        // Return the result as JSON
        res.status(200).json({
            success: true,
            data: flattenedReviews,
        });
    }
    catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch reviews",
        });
    }
};
exports.listAllReviewsNoPagination = listAllReviewsNoPagination;
/**
 * Create a new task.
 * Expected body: { task: string, deadline?: string, assignedAdminId?: number }
 */
const createTask = async (req, res) => {
    try {
        const { task, deadline, assignedAdminId } = req.body;
        if (!task) {
            res.status(400).json({ error: "Task description is required" });
            return;
        }
        const newTask = await prisma.task.create({
            data: {
                task,
                deadline: deadline ? new Date(deadline) : null,
                assignedAdminId: assignedAdminId || null,
            },
        });
        // Optionally, log activity if the task is assigned to an admin
        if (assignedAdminId) {
            await (0, activity_1.createActivity)("Task Created", `Task "${task}" has been created and assigned to admin (ID: ${assignedAdminId}).`);
        }
        else {
            await (0, activity_1.createActivity)("Task Created", `Task "${task}" has been created.`);
        }
        res.status(201).json({ success: true, data: newTask });
    }
    catch (error) {
        res.status(500).json({
            error: "Failed to create task",
            details: error.message,
        });
    }
};
exports.createTask = createTask;
/**
 * Get tasks for a specific admin.
 * Expected route parameter: /api/tasks/admin/:adminId
 */
const getTasksForAdmin = async (req, res) => {
    try {
        const { adminId } = req.params;
        if (!adminId) {
            res.status(400).json({ error: "Admin ID is required" });
            return;
        }
        const tasks = await prisma.task.findMany({
            where: { assignedAdminId: Number(adminId) },
            orderBy: { createdAt: "desc" },
        });
        res.status(200).json({ success: true, data: tasks });
    }
    catch (error) {
        res.status(500).json({
            error: "Failed to fetch tasks",
            details: error.message,
        });
    }
};
exports.getTasksForAdmin = getTasksForAdmin;
/**
 * Update the status (completed flag) of a task.
 * Expected body: { taskId: number, completed: boolean }
 */
const updateTaskStatus = async (req, res) => {
    try {
        const { taskId, completed } = req.body;
        if (taskId === undefined || completed === undefined) {
            res.status(400).json({
                error: "Task ID and completed status are required",
            });
            return;
        }
        const updatedTask = await prisma.task.update({
            where: { id: Number(taskId) },
            data: { completed: Boolean(completed) },
        });
        // Log activity about the status update
        await (0, activity_1.createActivity)("Task Updated", `Task with ID ${taskId} was marked as ${completed ? "completed" : "incomplete"}.`);
        res.status(200).json({ success: true, data: updatedTask });
    }
    catch (error) {
        res.status(500).json({
            error: "Failed to update task status",
            details: error.message,
        });
    }
};
exports.updateTaskStatus = updateTaskStatus;
const getAllSuggestions = async (req, res) => {
    try {
        // Fetch all suggestions, ordered by creation date (most recent first)
        const suggestions = await prisma.businessSuggestion.findMany({
            orderBy: { createdAt: "desc" },
        });
        res.status(200).json(suggestions);
    }
    catch (error) {
        res.status(500).json({
            error: "Failed to fetch suggestions",
            details: error.message,
        });
    }
};
exports.getAllSuggestions = getAllSuggestions;
