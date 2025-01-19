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
      query: text = "", // Search text (name, keywords, category)
      longitude,
      latitude,
    } = req.query; // Extract values from query parameters

    // Convert values to proper types
    const searchText = typeof text === "string" ? text.trim() : "";
    const userLongitude = Number(latitude); // Swapped: latitude as longitude
    const userLatitude = Number(longitude); // Swapped: longitude as latitude

    if (isNaN(userLongitude) || isNaN(userLatitude)) {
      res.status(400).json({ error: "Invalid longitude or latitude" });
      return;
    }

    console.log(
      "Received Coordinates (Swapped): Lat:",
      userLatitude,
      "Long:",
      userLongitude
    );

    const searchWords = searchText.split(/\s+/); // Split query text by spaces

    // **Round location to 1 decimal**
    const roundCoordinate = (value: number) => Math.round(value * 10) / 10;
    const roundedLat = roundCoordinate(userLatitude);
    const roundedLon = roundCoordinate(userLongitude);
    await prisma.locationSearch.upsert({
      where: {
        roundedLat_roundedLon: {
          roundedLat,
          roundedLon,
        },
      },
      update: { count: { increment: 1 } },
      create: { roundedLat, roundedLon, count: 1 },
    });
    // **Increment item search counts**

    await prisma.itemSearch.upsert({
      where: { item: searchText.trim() }, // Trim spaces
      update: { count: { increment: 1 } },
      create: { item: searchText.trim(), count: 1 }, // Trim spaces
    });

    const radiusInMiles = 50; // Radius for the search (50 miles)
    const latOffset = radiusInMiles / 69; // 1 degree latitude ≈ 69 miles
    const lngOffset =
      radiusInMiles / (69 * Math.cos(userLatitude * (Math.PI / 180))); // Longitude offset based on latitude

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
            keywords: {
              some: {
                name: { contains: searchText, mode: "insensitive" },
              },
            },
          },
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
      console.log(
        "No businesses found in this area with the given search text."
      );
    }

    // **Add distances to businesses and filter businesses within 50 miles**
    const businessesWithDistance = businesses
      .map((business: any) => {
        const distanceInMeters = getDistance(
          { latitude: userLatitude, longitude: userLongitude },
          { latitude: business.longitude, longitude: business.latitude }
        );
        const distanceInMiles = distanceInMeters / 1609.34; // Convert meters to miles

        return {
          ...business,
          distance: Number(distanceInMiles.toFixed(2)), // Append distance to each business
        };
      })
      .filter((business: any) => business.distance <= radiusInMiles)
      .sort((a: any, b: any) => a.distance - b.distance); // Sort by distance

    const matchingKeywords = await prisma.keyword.findMany({
      where: {
        OR: searchWords.map((word) => ({
          name: { contains: word, mode: "insensitive" },
        })),
      },
      take: 5, // Return up to 5 matching keywords
    });

    const keywordNames = matchingKeywords.map((keyword: any) => keyword.name);
    const totalBusinesses = businessesWithDistance.length;

    res.status(200).json({
      total: totalBusinesses,
      businesses: businessesWithDistance,
      matchingKeywords: keywordNames,
    });
  } catch (error: unknown) {
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
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: "Business ID is required" });
      return;
    }

    // Get current date (start of the day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateString = today.toISOString().split('T')[0];

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

    // Fetch business details
    const business = await prisma.business.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        keywords: true,
        reviews: {
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

    res.status(200).json({
      success: true,
      business,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error fetching business details",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
