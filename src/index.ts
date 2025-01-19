require("dotenv").config();
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import routes from "./routes";
import { redisClient } from "./config/redis";
import logger from "./utils/logger";
import { errorHandler } from "./middleware/errorHandler";
import os from "os";

const app = express();
// const prisma = new PrismaClient();
// Define allowed origins
const allowedOrigins = ["http://localhost:4000", "https://apneyy.om"];
// Configure CORS
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allowed?: boolean) => void) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true); // Allow requests from allowed origins
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: "GET,POST,PUT,PATCH,DELETE", // Allowed HTTP methods
  credentials: true, // Allow cookies and credentials
};


// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(compression());
app.use(express.json());
app.use(morgan("combined"));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.get("/", (req: Request, res: Response) => {
  const appVersion = process.env.npm_package_version || "1.0.0";
  res.status(200).json({
    success: true,
    message: "Server is up and running!",
    environment: process.env.NODE_ENV || "development",
    version: appVersion,
    uptime: `${Math.floor(process.uptime())}s`,
    hostname: os.hostname(),
  });
});


// Routes
app.use("/api", routes);

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  errorHandler(err, req, res, next);
});

const PORT = process.env.PORT || 3000;

async function startServer(): Promise<void> {
  try {
    // await redisClient.connect();
    logger.info("Redis connected successfully");

    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  } catch (error: any) {
    logger.error("Failed to start server:", error.message || error);
    process.exit(1);
  }
}

startServer();
