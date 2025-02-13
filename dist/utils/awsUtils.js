"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFileFromS3 = exports.getPresignedUrl = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Configure AWS S3
const s3 = new client_s3_1.S3({
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
const getPresignedUrl = async (req, res) => {
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
            ACL: "public-read", // Explicitly cast ACL to ObjectCannedACL
        };
        const uploadUrl = await (0, s3_request_presigner_1.getSignedUrl)(s3, new client_s3_1.PutObjectCommand(params), {
            expiresIn: 3600, // URL expires in 1 hour
        });
        res.status(200).json({ uploadUrl });
    }
    catch (error) {
        console.error("Error generating presigned URL:", error);
        res.status(500).json({ error: "Failed to generate presigned URL" });
    }
};
exports.getPresignedUrl = getPresignedUrl;
const deleteFileFromS3 = async (fileUrl) => {
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
        const command = new client_s3_1.DeleteObjectCommand(deleteParams);
        await s3.send(command);
        console.log(`File deleted successfully: ${key}`);
    }
    catch (error) {
        console.error("Error deleting file:", error);
        throw new Error("Failed to delete the file from S3");
    }
};
exports.deleteFileFromS3 = deleteFileFromS3;
