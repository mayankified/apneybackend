import { S3, PutObjectCommand, ObjectCannedACL, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";
import { Request, Response } from "express";

dotenv.config();

// Configure AWS S3
const s3 = new S3({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
  region: process.env.AWS_REGION || "",
});

// S3 Bucket name
const BUCKET_NAME = process.env.AWS_BUCKET_NAME || "";

/**
 * Generate a presigned URL for uploading a file to S3
 * @param req Express request object
 * @param res Express response object
 */

export const getPresignedUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fileName, fileType } = req.body;

    if (!fileName || !fileType) {
      res.status(400).json({ error: "File name and type are required" });
      return;
    }
    // Add a timestamp to the filename to make it unique
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-"); // Replace colons and dots to avoid path issues
    const uniqueFileName = `${timestamp}-${fileName}`;
    const params = {
      Bucket: BUCKET_NAME,
      Key: `uploads/${uniqueFileName}`, // Customize folder and file name
      ContentType: fileType,
      ACL: "public-read" as ObjectCannedACL, // Explicitly cast ACL to ObjectCannedACL
    };

    const uploadUrl = await getSignedUrl(s3, new PutObjectCommand(params), {
      expiresIn: 3600, // URL expires in 1 hour
    });

    res.status(200).json({ uploadUrl });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    res.status(500).json({ error: "Failed to generate presigned URL" });
  }
};


export const deleteFileFromS3 = async (fileUrl: string): Promise<void> => {
  try {
    const bucketName = process.env.AWS_BUCKET_NAME || "";

    // Extract the key from the URL
    const url = new URL(fileUrl);
    const key = decodeURIComponent(url.pathname.substring(1)); // Removes the leading '/'

    // Delete the file
    const deleteParams = {
      Bucket: bucketName,
      Key: key,
    };

    const command = new DeleteObjectCommand(deleteParams);
    await s3.send(command);

    console.log(`File deleted successfully: ${key}`);
  } catch (error) {
    console.error("Error deleting file:", error);
    throw new Error("Failed to delete the file from S3");
  }
};