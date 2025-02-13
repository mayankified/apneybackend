import { Request, Response } from "express";
import { Prisma, PrismaClient } from "@prisma/client";
import { redisClient } from "../config/redis";

const prisma = new PrismaClient();

// **Add a Business to Favorites (Update both `User` and `Business`)**
export const addFavorite = async (
  req: Request,
  res: Response
): Promise<void> => {
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
  } catch (error) {
    res.status(500).json({
      error: "Failed to add favorite",
      details: (error as Error).message,
    });
  }
};

// **Remove a Business from Favorites (Update both `User` and `Business`)**
export const removeFavorite = async (
  req: Request,
  res: Response
): Promise<void> => {
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
  } catch (error) {
    res.status(500).json({
      error: "Failed to remove favorite",
      details: (error as Error).message,
    });
  }
};

// **Get User's Favorite Businesses**
export const getFavorites = async (
  req: Request,
  res: Response
): Promise<void> => {
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
  } catch (error) {
    res.status(500).json({
      error: "Failed to retrieve favorites",
      details: (error as Error).message,
    });
  }
};
export const postReview = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId, businessId, content, aspects, imageUrl } = req.body;
    console.log(req.body);
    // Validate incoming request data
    if (
      !userId ||
      !businessId ||
      !content ||
      !aspects ||
      !Array.isArray(aspects)
    ) {
      res.status(400).json({
        error:
          "All fields (userId, businessId, content, and aspects) are required, and aspects must be an array.",
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
      if (
        !Number.isInteger(aspect.rating) || // Ensure the rating is an integer
        aspect.rating < 1 ||
        aspect.rating > 5
      ) {
        res.status(400).json({
          error: "Each aspect's rating must be an integer between 1 and 5.",
        });
        return;
      }
    }

    // Calculate overall average rating
    const overallRating = Math.round(
      aspects.reduce((sum, aspect) => sum + aspect.rating, 0) / aspects.length
    );

    // Create the review in the database
    const review = await prisma.review.create({
      data: {
        content,
        rating: overallRating, // Save the calculated average rating
        userId,
        businessId,
        aspects: aspects as Prisma.InputJsonValue, // Save aspects as JSON
        image: imageUrl,
      },
    });

    const cacheKey = `business:${businessId}`; // Unique cache key for this business
    await redisClient.del(cacheKey);
    await redisClient.del("nonVerifiedReviews");

    res.status(201).json({
      message: "Review posted successfully",
      review,
    });
  } catch (error) {
    console.error("Error in postReview:", error); // Log the error for debugging
    res.status(500).json({
      error: "Failed to post review",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// **Get User's Reviews**
export const getUserReviews = async (
  req: Request,
  res: Response
): Promise<void> => {
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
  } catch (error) {
    res.status(500).json({
      error: "Failed to get reviews",
      details: (error as Error).message,
    });
  }
};

export const deleteUser = async (
  req: Request,
  res: Response
): Promise<void> => {
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
  } catch (error) {
    res.status(500).json({
      error: "Failed to delete user",
      details: (error as Error).message,
    });
  }
};
