import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Function to create an Activity log
 * @param {string} name - Name of the activity
 * @param {string} text - Description or details about the activity
 * @param {string} adminId - ID of the admin performing the activity
 */
export const createActivity = async (name: string, text: string) => {
  try {
    const activity = await prisma.activity.create({
      data: {
        name,
        text,
      },
    });

    console.log("Activity created:", activity);
    return activity;
  } catch (error) {
    console.error("Error creating activity:", error);
    throw new Error("Failed to create activity");
  }
};
