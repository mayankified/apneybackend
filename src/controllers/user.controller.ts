import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// **Add a Business to Favorites (Update both `User` and `Business`)**
export const addFavorite = async (req: Request, res: Response): Promise<void> => {
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
    res.status(500).json({ error: "Failed to add favorite", details: (error as Error).message });
  }
};

// **Remove a Business from Favorites (Update both `User` and `Business`)**
export const removeFavorite = async (req: Request, res: Response): Promise<void> => {
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
    res.status(500).json({ error: "Failed to remove favorite", details: (error as Error).message });
  }
};

// **Get User's Favorite Businesses**
export const getFavorites = async (req: Request, res: Response): Promise<void> => {
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
    res.status(500).json({ error: "Failed to retrieve favorites", details: (error as Error).message });
  }
};
// **Post a Review**
export const postReview = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, businessId, content, rating } = req.body;
  
      // Validate incoming request data
      if (!userId || !businessId || !content || typeof rating !== "number") {
        res.status(400).json({ error: "All fields (userId, businessId, content, and rating) are required" });
        return;
      }
  
      // Ensure the rating is within a valid range (e.g., 1 to 5)
      if (rating < 1 || rating > 5) {
        res.status(400).json({ error: "Rating must be between 1 and 5" });
        return;
      }
  
      const review = await prisma.review.create({
        data: {
          content,
          rating,
          userId,
          businessId,
        },
      });
  
      res.status(201).json(review);
    } catch (error) {
      res.status(500).json({ error: "Failed to post review", details: (error as Error).message });
    }
  };
  
  // **Get User's Reviews**
  export const getUserReviews = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.body;
  
      // Validate incoming request data
      if (!userId) {
        res.status(400).json({ error: "userId is required" });
        return;
      }
  
      const reviews = await prisma.review.findMany({
        where: { userId },
        include: { user: true },
      });
  
      if (reviews.length === 0) {
        res.status(404).json({ message: "No reviews found for this user" });
        return;
      }
  
      res.status(200).json(reviews);
    } catch (error) {
      res.status(500).json({ error: "Failed to get reviews", details: (error as Error).message });
    }
  };
  