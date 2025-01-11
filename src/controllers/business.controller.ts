import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { getDistance } from "geolib";

const prisma = new PrismaClient();

// **List Businesses**
export const listBusinesses = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      page = "1", // Default page number as string
      pageSize = "20", // Default 20 businesses per page as string
      query: text = "", // Search text (name, keywords, category)
      longitude,
      latitude,
    } = req.query; // Extract values from query parameters

    // Convert values to proper types
    const pageNum = Number(page);
    const limit = Number(pageSize);
    const searchText = typeof text === "string" ? text.trim() : "";
    const userLongitude = Number(longitude);
    const userLatitude = Number(latitude);

    if (isNaN(userLongitude) || isNaN(userLatitude)) {
      res.status(400).json({ error: "Invalid longitude or latitude" });
      return;
    }
    const searchWords = searchText.split(/\s+/); // Split by spaces
    // Bounding box for 50 miles (approximate)
    const radiusInMiles = 50;
    const latOffset = radiusInMiles / 69; // 1 degree latitude ≈ 69 miles
    const lngOffset =
      radiusInMiles / (69 * Math.cos(userLatitude * (Math.PI / 180)));
    // Bounding box coordinates
    const minLat = userLatitude - latOffset;
    const maxLat = userLatitude + latOffset;
    const minLng = userLongitude - lngOffset;
    const maxLng = userLongitude + lngOffset;

    // Get businesses within bounding box and search query
    const businesses = await prisma.business.findMany({
      where: {
        latitude: { gte: minLat, lte: maxLat },
        longitude: { gte: minLng, lte: maxLng },
        OR: [
          { businessName: { contains: searchText, mode: "insensitive" } },
          { category: { contains: searchText, mode: "insensitive" } },
          {
            keywords: {
              some: {
                name: {
                  contains: searchText,
                  mode: "insensitive", // Case-insensitive search
                },
              },
            },
          },
        ],
      },
      include: {
        keywords: true, // Include associated keywords for reference
      },
    });
    // Add distances to businesses and filter businesses within 50 miles
    const businessesWithDistance = businesses
      .map((business) => {
        const distanceInMeters = getDistance(
          { latitude: userLatitude, longitude: userLongitude },
          { latitude: business.latitude, longitude: business.longitude }
        );
        const distanceInMiles = distanceInMeters / 1609.34; // Convert meters to miles

        return {
          ...business,
          distance: Number(distanceInMiles.toFixed(2)), // Append distance to each business
        };
      })
      .filter((business) => business.distance <= radiusInMiles)
      .sort((a, b) => a.distance - b.distance); // Keep only businesses within 50 miles

    // const filteredBusinesses = businesses;
    const matchingKeywords = await prisma.keyword.findMany({
      where: {
        OR: searchWords.map((word) => ({
          name: {
            contains: word,
            mode: "insensitive",
          },
        })),
      },
      take: 5, // Return only 5 matching keywords
    });
    // Extract keyword names
    const keywordNames = matchingKeywords.map((keyword) => keyword.name);
    // Pagination
    const totalBusinesses = businessesWithDistance.length;
    const paginatedBusinesses = businessesWithDistance.slice(
      (pageNum - 1) * limit,
      pageNum * limit
    );

    // Response
    res.status(200).json({
      total: totalBusinesses,
      page: pageNum,
      pageSize: limit,
      businesses: paginatedBusinesses,
      matchingKeywords: keywordNames,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res
        .status(500)
        .json({ error: "Error fetching businesses", details: error.message });
      return;
    }
    res.status(500).json({ error: "Unknown error occurred" });
  }
};

// **Search Suggestions API (with body text input)**
export const searchSuggestions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { text = "" } = req.body; // Extract `text` from the request body

    if (typeof text !== "string" || text.trim() === "") {
      res.status(400).json({
        error: "Text parameter is required and must be a non-empty string",
      });
      return;
    }

    // Fetch keywords matching the search text (case-insensitive)
    const suggestions = await prisma.keyword.findMany({
      where: {
        name: {
          contains: text.trim(),
          mode: "insensitive", // Case-insensitive search
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
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
  } catch (error: unknown) {
    if (error instanceof Error) {
      res
        .status(500)
        .json({ error: "Error fetching suggestions", details: error.message });
      return;
    }
    res.status(500).json({ error: "Unknown error occurred" });
  }
};

// **Get Business Details by ID**
export const getBusinessById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params; // Extract business ID from URL params

    if (!id) {
      res.status(400).json({ error: "Business ID is required" });
      return;
    }

    // Fetch business details by ID
    const business = await prisma.business.findUnique({
      where: {
        id: Number(id), // Convert id to number since Prisma expects an integer
      },
      include: {
        keywords: true, // Include associated keywords
        reviews: true, // Include associated reviews (if you have a Review model)
      },
    });

    if (!business) {
      res.status(404).json({ error: "Business not found" });
      return;
    }

    // Respond with the business details
    res.status(200).json({
      success: true,
      business,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res
        .status(500)
        .json({
          error: "Error fetching business details",
          details: error.message,
        });
      return;
    }
    res.status(500).json({ error: "Unknown error occurred" });
  }
};
