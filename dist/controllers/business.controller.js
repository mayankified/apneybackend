"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listBusinessesByCategory = exports.updateImage = exports.deleteBusiness = exports.getSearchSuggestions = exports.getBusinessAnalytics = exports.getBusinessReviews = exports.toggleBusinessOpenState = exports.getBusinessStats = exports.getBusinessById = exports.searchSuggestions = exports.listBusinesses = void 0;
const client_1 = require("@prisma/client");
const geolib_1 = require("geolib");
const redis_1 = require("../config/redis");
const prisma = new client_1.PrismaClient();
// **List Businesses**
const listBusinesses = async (req, res) => {
    try {
        const { query: text = "", // Search text (name, keywords, category)
        longitude, latitude, } = req.query; // Extract values from query parameters
        // Convert values to proper types
        const searchText = typeof text === "string" ? text.trim() : "";
        const userLongitude = Number(latitude); // Swapped: latitude as longitude
        const userLatitude = Number(longitude); // Swapped: longitude as latitude
        if (isNaN(userLongitude) || isNaN(userLatitude)) {
            res.status(400).json({ error: "Invalid longitude or latitude" });
            return;
        }
        console.log("Received Coordinates (Swapped): Lat:", userLatitude, "Long:", userLongitude);
        const searchWords = searchText.split(/\s+/); // Split query text by spaces
        await prisma.itemSearch.upsert({
            where: { item: searchText.trim() }, // Trim spaces
            update: { count: { increment: 1 } },
            create: { item: searchText.trim(), count: 1 }, // Trim spaces
        });
        const radiusInMiles = 50; // Radius for the search (50 miles)
        const latOffset = radiusInMiles / 69; // 1 degree latitude ≈ 69 miles
        const lngOffset = radiusInMiles / (69 * Math.cos(userLatitude * (Math.PI / 180))); // Longitude offset based on latitude
        // **Bounding Box Coordinates:**
        const minLat = userLatitude - latOffset;
        const maxLat = userLatitude + latOffset;
        const minLng = userLongitude - lngOffset;
        const maxLng = userLongitude + lngOffset;
        console.log("Bounding Box:", { minLat, maxLat, minLng, maxLng });
        // **Find businesses within bounding box and matching query**
        const businesses = await prisma.business.findMany({
            where: {
                longitude: { gte: minLat, lte: maxLat }, // Swapped: using longitude as latitude
                latitude: { gte: minLng, lte: maxLng }, // Swapped: using latitude as longitude
                OR: [
                    { businessName: { contains: searchText, mode: "insensitive" } },
                    { category: { contains: searchText, mode: "insensitive" } },
                    {
                        tags: {
                            some: {
                                name: { contains: searchText, mode: "insensitive" },
                            },
                        },
                    },
                ],
            },
            select: {
                id: true, // Unique identifier (required for keys and linking)
                businessName: true, // Displayed in the business card
                imageUrls: true, // Display first image
                isOpen: true, // To show "Closed" badge
                rating: true, // Display rating stars
                category: true, // Category name (e.g., restaurant, salon)
                address: true, // Business address (displayed in card)
                latitude: true, // For display purposes
                longitude: true, // For display purposes
                isVerified: true, // To apply the verified filter
            },
        });
        if (businesses.length === 0) {
            console.log("No businesses found in this area with the given search text.");
        }
        // **Add distances to businesses and filter businesses within 50 miles**
        const businessesWithDistance = businesses
            .map((business) => {
            const distanceInMeters = (0, geolib_1.getDistance)({ latitude: userLatitude, longitude: userLongitude }, { latitude: business.longitude, longitude: business.latitude });
            const distanceInMiles = distanceInMeters / 1609.34; // Convert meters to miles
            return {
                ...business,
                distance: Number(distanceInMiles.toFixed(2)), // Append distance to each business
            };
        })
            .filter((business) => business.distance <= radiusInMiles)
            .sort((a, b) => a.distance - b.distance); // Sort by distance
        const matchingKeywords = await prisma.tag.findMany({
            where: {
                OR: searchWords.map((word) => ({
                    name: { contains: word, mode: "insensitive" },
                })),
            },
            take: 5, // Return up to 5 matching keywords
        });
        const keywordNames = matchingKeywords.map((keyword) => keyword.name);
        const totalBusinesses = businessesWithDistance.length;
        res.status(200).json({
            total: totalBusinesses,
            businesses: businessesWithDistance,
            matchingKeywords: keywordNames,
        });
    }
    catch (error) {
        if (error instanceof Error) {
            console.error("Error fetching businesses:", error.message);
            res
                .status(500)
                .json({ error: "Error fetching businesses", details: error.message });
            return;
        }
        res.status(500).json({ error: "Unknown error occurred" });
    }
};
exports.listBusinesses = listBusinesses;
// **Search Suggestions API (with body text input)**
const searchSuggestions = async (req, res) => {
    try {
        const { text = "" } = req.body; // Extract `text` from the request body
        if (typeof text !== "string" || text.trim() === "") {
            res.status(400).json({
                error: "Text parameter is required and must be a non-empty string",
            });
            return;
        }
        // Fetch keywords matching the search text (case-insensitive)
        const suggestions = await prisma.tag.findMany({
            where: {
                name: {
                    contains: text.trim(),
                    mode: "insensitive", // Case-insensitive search
                },
            },
            select: {
                id: true,
                name: true,
            },
            orderBy: {
                name: "asc", // Sort suggestions alphabetically
            },
            take: 5, // Limit to 5 suggestions
        });
        // Response
        res.status(200).json({
            text,
            totalSuggestions: suggestions.length,
            suggestions,
        });
    }
    catch (error) {
        if (error instanceof Error) {
            res
                .status(500)
                .json({ error: "Error fetching suggestions", details: error.message });
            return;
        }
        res.status(500).json({ error: "Unknown error occurred" });
    }
};
exports.searchSuggestions = searchSuggestions;
const getBusinessById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ error: "Business ID is required" });
            return;
        }
        const cacheKey = `business:${id}`; // Unique cache key for this business
        const cachedData = await redis_1.redisClient.get(cacheKey);
        // Return cached data if it exists
        if (cachedData) {
            console.log("Cache hit for business:", id);
            res.status(200).json(JSON.parse(cachedData));
            return;
        }
        // Get current date (start of the day)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dateString = today.toISOString().split("T")[0];
        // Upsert ViewInteraction for the current date
        await prisma.viewInteraction.upsert({
            where: {
                businessId_date: {
                    businessId: Number(id), // Business ID
                    date: new Date(dateString), // Date without time
                },
            },
            update: {
                views: { increment: 1 }, // Increment view count
            },
            create: {
                businessId: Number(id),
                views: 1,
                date: new Date(dateString), // Set the date
            },
        });
        // Fetch business details from the database
        const business = await prisma.business.findUnique({
            where: {
                id: Number(id),
            },
            include: {
                reviews: {
                    where: {
                        isVerified: true, // Only show verified reviews
                    },
                    include: {
                        user: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
        });
        if (!business) {
            res.status(404).json({ error: "Business not found" });
            return;
        }
        const responseData = {
            success: true,
            business,
        };
        // Cache the fetched data for 1 hour
        await redis_1.redisClient.setex(cacheKey, 3600, JSON.stringify(responseData));
        console.log("Cache miss for business:", id);
        res.status(200).json(responseData);
    }
    catch (error) {
        console.error("Error fetching business details:", error);
        res.status(500).json({
            error: "Error fetching business details",
            details: error.message || "Unknown error",
        });
    }
};
exports.getBusinessById = getBusinessById;
// Get Business Statistics
const getBusinessStats = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ error: "Business ID is required" });
            return;
        }
        // Fetch Total Views for the business
        const totalViews = await prisma.viewInteraction.aggregate({
            where: { businessId: Number(id) },
            _sum: { views: true },
        });
        const newReviewsCount = await prisma.review.count({
            where: {
                businessId: Number(id),
            },
        });
        // Calculate Average Rating for the business
        const averageRating = await prisma.review.aggregate({
            where: { businessId: Number(id) },
            _avg: { rating: true },
        });
        // Count Favorites for the business
        const favoriteCount = await prisma.business.findUnique({
            where: { id: Number(id) },
            select: { favoritedBy: true },
        });
        if (!favoriteCount) {
            res.status(404).json({ error: "Business not found" });
            return;
        }
        // Return the aggregated statistics
        res.status(200).json({
            success: true,
            data: {
                totalViews: totalViews._sum.views || 0,
                newReviews: newReviewsCount || 0,
                averageRating: averageRating._avg.rating || 0,
                favorites: favoriteCount.favoritedBy.length || 0,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            error: "Error fetching business statistics",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.getBusinessStats = getBusinessStats;
const toggleBusinessOpenState = async (req, res) => {
    try {
        const { id, state } = req.body; // Extract id and state ('open' or 'close') from the request body
        // Validate parameters
        if (!id || !state) {
            res
                .status(400)
                .json({ error: "Both 'id' and 'state' parameters are required." });
            return;
        }
        if (!["open", "close"].includes(state)) {
            res
                .status(400)
                .json({ error: "State must be either 'open' or 'close'." });
            return;
        }
        // Convert 'state' to boolean
        const isOpen = state === "open";
        // Update the `isOpen` field in the database
        const updatedBusiness = await prisma.business.update({
            where: { id: Number(id) },
            data: { isOpen },
        });
        res.status(200).json({
            success: true,
            message: `Business state updated to '${state}'.`,
            business: updatedBusiness,
        });
    }
    catch (error) {
        console.error("Error toggling business state:", error);
        res.status(500).json({
            success: false,
            error: "Failed to toggle the business open state.",
            details: error.message,
        });
    }
};
exports.toggleBusinessOpenState = toggleBusinessOpenState;
const getBusinessReviews = async (req, res) => {
    try {
        const { id } = req.params; // Get business ID from URL params
        // Validate business ID
        if (!id) {
            res.status(400).json({ error: "Business ID is required" });
            return;
        }
        const businessId = Number(id);
        const cacheKey = `businessReviews:${businessId}`; // Unique cache key for reviews
        // Check if cached data exists
        const cachedData = await redis_1.redisClient.get(cacheKey);
        if (cachedData) {
            console.log("Cache hit for business reviews");
            res.status(200).json({
                success: true,
                data: JSON.parse(cachedData),
            });
            return;
        }
        // Fetch reviews for the business
        const reviews = await prisma.review.findMany({
            where: {
                businessId, // Ensure the ID is a number
            },
            include: {
                user: {
                    select: {
                        name: true, // Include the name of the user who posted the review
                    },
                },
            },
            orderBy: {
                createdAt: "desc", // Sort by most recent reviews
            },
        });
        // Cache the reviews with an expiration time (e.g., 1 hour)
        await redis_1.redisClient.setex(cacheKey, 3600, JSON.stringify(reviews)); // Cache for 1 hour
        // Return reviews, even if the array is empty
        res.status(200).json({
            success: true,
            data: reviews,
        });
    }
    catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).json({
            error: "Error fetching reviews",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.getBusinessReviews = getBusinessReviews;
const getBusinessAnalytics = async (req, res) => {
    try {
        const { id } = req.params; // Get the business ID from the request params
        if (!id) {
            res.status(400).json({ error: "Business ID is required." });
            return;
        }
        const businessId = Number(id);
        // Define a cache key based on the business ID
        const cacheKey = `businessAnalytics:${businessId}`;
        // Check if data is already cached
        const cachedData = await redis_1.redisClient.get(cacheKey);
        if (cachedData) {
            console.log("Cache hit for business analytics");
            res.status(200).json(JSON.parse(cachedData));
            return;
        }
        // Fetch view interactions for the last 7 days
        const last7DaysViews = await prisma.viewInteraction.findMany({
            where: {
                businessId,
                date: {
                    gte: new Date(new Date().setDate(new Date().getDate() - 7)), // Last 7 days
                },
            },
            orderBy: { date: "asc" },
        });
        const viewCount = Array(7).fill(0); // Initialize an array with 7 days
        last7DaysViews.forEach((interaction) => {
            const dayIndex = Math.floor((new Date(interaction.date).getTime() -
                new Date().setDate(new Date().getDate() - 7)) /
                (1000 * 60 * 60 * 24));
            if (dayIndex >= 0 && dayIndex < 7) {
                viewCount[dayIndex] = interaction.views;
            }
        });
        // Fetch reviews for the last 7 days
        const last7DaysReviews = await prisma.review.findMany({
            where: {
                businessId,
                createdAt: {
                    gte: new Date(new Date().setDate(new Date().getDate() - 7)), // Last 7 days
                },
            },
            orderBy: { createdAt: "asc" },
        });
        const ratingData = Array(7).fill(0); // Initialize an array for ratings
        const ratingCounts = Array(7).fill(0); // To calculate the average per day
        last7DaysReviews.forEach((review) => {
            const dayIndex = Math.floor((new Date(review.createdAt).getTime() -
                new Date().setDate(new Date().getDate() - 7)) /
                (1000 * 60 * 60 * 24));
            if (dayIndex >= 0 && dayIndex < 7) {
                ratingData[dayIndex] += review.rating;
                ratingCounts[dayIndex] += 1;
            }
        });
        // Calculate the average rating for each day
        for (let i = 0; i < 7; i++) {
            if (ratingCounts[i] > 0) {
                ratingData[i] = ratingData[i] / ratingCounts[i];
            }
        }
        // Prepare response data
        const responseData = {
            views: viewCount,
            ratings: ratingData,
        };
        // Cache the data with an expiration time (e.g., 1 hour)
        await redis_1.redisClient.setex(cacheKey, 3600, JSON.stringify(responseData)); // 3600 seconds = 1 hour
        res.status(200).json({
            success: true,
            data: responseData,
        });
    }
    catch (error) {
        console.error("Error fetching analytics data:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch analytics data.",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.getBusinessAnalytics = getBusinessAnalytics;
const getSearchSuggestions = async (req, res) => {
    try {
        const { query } = req.body; // Extract query from request body
        console.log("Received query:", query);
        // Validate that query is provided and is a string
        if (!query || typeof query !== "string") {
            res
                .status(400)
                .json({ error: "Search query is required and must be a string." });
            return;
        }
        // Search for businesses matching the query in the `businessName`
        const suggestions = await prisma.business.findMany({
            where: {
                businessName: {
                    contains: query, // Perform a case-insensitive search
                    mode: "insensitive",
                },
            },
            select: {
                id: true, // Include the business ID
                businessName: true,
                zipcode: true,
            },
            take: 5, // Limit results to 5
        });
        res.status(200).json({
            success: true,
            data: suggestions,
        });
    }
    catch (error) {
        console.error("Error fetching search suggestions:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch search suggestions.",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.getSearchSuggestions = getSearchSuggestions;
// **Delete Business**
const deleteBusiness = async (req, res) => {
    try {
        const { businessId } = req.body;
        if (!businessId) {
            res.status(400).json({ error: "Business ID is required" });
            return;
        }
        await prisma.review.deleteMany({
            where: { businessId: businessId },
        });
        await prisma.viewInteraction.deleteMany({
            where: { businessId: businessId },
        });
        const deletedBusiness = await prisma.business.delete({
            where: { id: businessId },
        });
        res
            .status(200)
            .json({ message: "Business deleted successfully", deletedBusiness });
    }
    catch (error) {
        res.status(500).json({
            error: "Failed to delete business",
            details: error.message,
        });
    }
};
exports.deleteBusiness = deleteBusiness;
const updateImage = async (req, res) => {
    try {
        const { businessId, imageUrl, action } = req.body;
        if (!businessId || !imageUrl || !action) {
            res.status(400).json({
                error: "Business ID, imageUrl, and action (add/remove) are required.",
            });
            return;
        }
        // Ensure businessId is a number
        const businessIdInt = parseInt(businessId, 10);
        if (isNaN(businessIdInt)) {
            res.status(400).json({ error: "Invalid business ID format." });
            return;
        }
        // Fetch the business
        const business = await prisma.business.findUnique({
            where: { id: businessIdInt },
        });
        if (!business) {
            res.status(404).json({ error: "Business not found." });
            return;
        }
        // Ensure imageUrls is an array
        let updatedImageUrls = Array.isArray(business.imageUrls)
            ? business.imageUrls
            : [];
        if (action === "remove") {
            // Remove image URL if it exists
            updatedImageUrls = updatedImageUrls.filter((url) => url !== imageUrl);
        }
        else if (action === "add") {
            // Add new image URL if not already in the list
            if (!updatedImageUrls.includes(imageUrl)) {
                updatedImageUrls.push(imageUrl);
            }
        }
        else {
            res.status(400).json({ error: "Invalid action. Use 'add' or 'remove'." });
            return;
        }
        // Update the business record
        const updatedBusiness = await prisma.business.update({
            where: { id: businessIdInt },
            data: {
                imageUrls: updatedImageUrls,
                isImageUpdated: action == "add", // Mark as updated
            },
        });
        await res
            .status(200)
            .json({ message: "Image update successful.", updatedBusiness });
    }
    catch (error) {
        console.error("Error updating images:", error);
        res.status(500).json({ error: "Internal server error." });
    }
};
exports.updateImage = updateImage;
const listBusinessesByCategory = async (req, res) => {
    try {
        const { longitude, latitude, categories } = req.body;
        // Convert input to proper types
        const userLongitude = Number(longitude);
        const userLatitude = Number(latitude);
        const category = typeof categories === "string" ? categories.trim() : "";
        // Validate longitude and latitude
        if (isNaN(userLongitude) || isNaN(userLatitude)) {
            res.status(400).json({ error: "Invalid longitude or latitude" });
            return;
        }
        console.log("User Coordinates: Lat:", userLatitude, "Long:", userLongitude);
        console.log("Category:", category);
        const radiusInMiles = 50; // Search radius in miles
        const latOffset = radiusInMiles / 69; // Approx 1 degree latitude = 69 miles
        const lngOffset = radiusInMiles / (69 * Math.cos(userLatitude * (Math.PI / 180))); // Adjust for latitude
        // Bounding Box Calculation
        const minLat = userLatitude - latOffset;
        const maxLat = userLatitude + latOffset;
        const minLng = userLongitude - lngOffset;
        const maxLng = userLongitude + lngOffset;
        console.log("Bounding Box:", { minLat, maxLat, minLng, maxLng });
        // Fetch businesses in the bounding box with matching category
        const businesses = await prisma.business.findMany({
            where: {
                latitude: { gte: minLng, lte: maxLng },
                longitude: { gte: minLat, lte: maxLat },
                ...(category
                    ? { category: { equals: category, mode: "insensitive" } }
                    : {}),
            },
            select: {
                id: true,
                businessName: true,
                imageUrls: true,
                isOpen: true,
                rating: true,
                category: true,
                address: true,
                latitude: true,
                longitude: true,
                isVerified: true,
                interactions: {
                    select: {
                        views: true,
                    },
                },
            },
        });
        console.log(businesses);
        // If no businesses are found in the location boundary, use a fallback query
        if (businesses.length === 0) {
            const overallBusinesses = await prisma.business.findMany({
                where: {
                    ...(category
                        ? { category: { equals: category, mode: "insensitive" } }
                        : {}),
                },
                select: {
                    id: true,
                    businessName: true,
                    imageUrls: true,
                    isOpen: true,
                    rating: true,
                    category: true,
                    address: true,
                    latitude: true,
                    longitude: true,
                    isVerified: true,
                    interactions: {
                        select: {
                            views: true,
                        },
                    },
                },
            });
            const fallbackBusinesses = overallBusinesses
                .map((business) => {
                const totalViews = business.interactions.reduce((sum, interaction) => sum + interaction.views, 0);
                return {
                    ...business,
                    totalViews,
                    distance: null, // Distance is not applicable here since the location is ignored
                };
            })
                .sort((a, b) => b.totalViews - a.totalViews)
                .slice(0, 5);
            res.status(200).json({
                total: fallbackBusinesses.length,
                businesses: fallbackBusinesses,
                current: false,
            });
            return;
        }
        // Calculate distances and filter businesses within 50 miles
        const businessesWithDistance = businesses
            .map((business) => {
            const distanceInMeters = (0, geolib_1.getDistance)({ latitude: userLatitude, longitude: userLongitude }, { latitude: business.longitude, longitude: business.latitude });
            const distanceInMiles = distanceInMeters / 1609.34;
            return {
                ...business,
                distance: Number(distanceInMiles.toFixed(2)),
                totalViews: business.interactions.reduce((sum, interaction) => sum + interaction.views, 0), // Using the correct field name
            };
        })
            .filter((business) => business.distance <= radiusInMiles)
            .sort((a, b) => b.totalViews - a.totalViews)
            .slice(0, 5);
        res.status(200).json({
            total: businessesWithDistance.length,
            businesses: businessesWithDistance,
            current: true,
        });
    }
    catch (error) {
        console.error("Error fetching businesses:", error);
        res.status(500).json({ error: "Error fetching businesses" });
    }
};
exports.listBusinessesByCategory = listBusinessesByCategory;
