"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createActivity = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Function to create an Activity log
 * @param {string} name - Name of the activity
 * @param {string} text - Description or details about the activity
 * @param {string} adminId - ID of the admin performing the activity
 */
const createActivity = async (name, text) => {
    try {
        const activity = await prisma.activity.create({
            data: {
                name,
                text,
            },
        });
        console.log("Activity created:", activity);
        return activity;
    }
    catch (error) {
        console.error("Error creating activity:", error);
        throw new Error("Failed to create activity");
    }
};
exports.createActivity = createActivity;
