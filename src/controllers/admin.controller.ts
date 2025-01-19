import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getUserCreatedCountByDay = async (req: Request, res: Response): Promise<void> => {
  try {
    // Group by the date part of createdAt and sum the count
    const usersCountByDay = await prisma.$queryRaw<
      { date: Date; count: bigint }[]
    >`
      SELECT
        DATE("createdAt") AS date,
        COUNT(id) AS count
      FROM "User"
      GROUP BY DATE("createdAt")
      ORDER BY DATE("createdAt") ASC;
    `;

     // Count total users using Prisma count method
     const totalUsers = await prisma.user.count();

    // Extract total count from the result

    // Convert BigInt to string to avoid serialization issues
    const formattedData = usersCountByDay.map((item) => ({
      date: item.date.toISOString().split('T')[0],
      count: item.count.toString(),
    }));

    res.status(200).json({
      totalUsers: totalUsers.toString(), // Convert total user count to string
      usersByDay: formattedData,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch user created count",
      details: (error as Error).message,
    });
  }
};

  
export const getBusinessCreatedCountByDay = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Group by the date part of createdAt, and sum the count
    const businessCountByDay = await prisma.$queryRaw<
      { date: Date; count: bigint }[]
    >`
      SELECT
        DATE("createdAt") AS date,
        COUNT(id) AS count
      FROM "Business"
      GROUP BY DATE("createdAt")
      ORDER BY DATE("createdAt") ASC;
    `;

    // Get total business count
    const totalBusiness=await prisma.business.count();


    // Convert BigInt to string to avoid serialization issues
    const formattedData = businessCountByDay.map((item) => ({
      date: item.date.toISOString().split('T')[0],
      count: item.count.toString(),
    }));

    res.status(200).json({
      totalBusinesses: totalBusiness.toString(), // Convert total business count to string
      businessesByDay: formattedData,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch business created count",
      details: (error as Error).message,
    });
  }
};

  

// **Mark Business as Verified**
export const verifyBusiness = async (req: Request, res: Response): Promise<void> => {
  try {
    const { businessId } = req.body;

    if (!businessId) {
      res.status(400).json({ error: "Business ID is required" });
      return;
    }

    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: { isVerified: true },
    });

    res.status(200).json({ message: "Business verified successfully", updatedBusiness });
  } catch (error) {
    res.status(500).json({ error: "Failed to verify business", details: (error as Error).message });
  }
};

// **Delete Business**
export const deleteBusiness = async (req: Request, res: Response): Promise<void> => {
  try {
    const { businessId } = req.body;

    if (!businessId) {
      res.status(400).json({ error: "Business ID is required" });
      return;
    }

    const deletedBusiness = await prisma.business.delete({
      where: { id: businessId },
    });

    res.status(200).json({ message: "Business deleted successfully", deletedBusiness });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete business", details: (error as Error).message });
  }
};

// **Delete User**
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
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
    res.status(500).json({ error: "Failed to delete user", details: (error as Error).message });
  }
};

// **Get Total Views of All Businesses (Daywise Analytics)**
export const getTotalViewsByDay = async (req: Request, res: Response): Promise<void> => {
  try {
    const totalViewsByDay = await prisma.viewInteraction.groupBy({
      by: ['date'],
      _sum: {
        views: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    res.status(200).json(totalViewsByDay);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch total views", details: (error as Error).message });
  }
};
