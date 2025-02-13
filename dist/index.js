"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const routes_1 = __importDefault(require("./routes"));
const logger_1 = __importDefault(require("./utils/logger"));
const errorHandler_1 = require("./middleware/errorHandler");
const os_1 = __importDefault(require("os"));
const redis_1 = require("./config/redis");
const app = (0, express_1.default)();
// Define allowed origins
const allowedOrigins = ["http://localhost:4000", "https://apneyy.com", "https://www.apneyy.com", "http://localhost:5173", "http://localhost:5174", "https://apneyy-partners.vercel.app", "https://partner.apneyy.com", "https://admin.apneyy.com", "https://admin-apneyy.vercel.app"];
// Configure CORS
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true); // Allow requests from allowed origins
        }
        else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods: "GET,POST,PUT,PATCH,DELETE", // Allowed HTTP methods
    credentials: true, // Allow cookies and credentials
};
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)(corsOptions));
app.use((0, compression_1.default)());
app.use(express_1.default.json());
app.use((0, morgan_1.default)("combined"));
app.use(express_1.default.urlencoded({ extended: true }));
// Rate limiting  
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);
app.get("/", (req, res) => {
    const appVersion = process.env.npm_package_version || "1.0.0";
    res.status(200).json({
        success: true,
        message: "Server is up and running!",
        environment: process.env.NODE_ENV || "development",
        version: appVersion,
        uptime: `${Math.floor(process.uptime())}s`,
        hostname: os_1.default.hostname(),
    });
});
// Routes
app.use("/api", routes_1.default);
// Error handling
app.use((err, req, res, next) => {
    (0, errorHandler_1.errorHandler)(err, req, res, next);
});
const PORT = process.env.PORT || 3000;
async function startServer() {
    try {
        // Test connection to Redis
        await redis_1.redisClient.ping(); // Simple Redis ping to ensure connection works
        logger_1.default.info("Redis connected successfully");
        app.listen(PORT, () => {
            logger_1.default.info(`Server is running on port ${PORT}`);
        });
    }
    catch (error) {
        logger_1.default.error("Failed to start server:", error.message || error);
        process.exit(1);
    }
}
startServer();
