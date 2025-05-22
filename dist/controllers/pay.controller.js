"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSubscription = exports.getSubscriptionsByBusinessId = exports.getSubscriptions = exports.saveSubscription = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Function to obtain an access token using your PayPal client credentials
async function getAccessToken() {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const response = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Basic ${basicAuth}`,
        },
        body: "grant_type=client_credentials",
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error("Failed to obtain access token from PayPal: " + errorText);
    }
    const data = await response.json();
    return data.access_token;
}
// Helper function to verify subscription with PayPal using our access token
async function verifySubscription(subscriptionID) {
    // Obtain a fresh access token using your client credentials
    const accessToken = await getAccessToken();
    const url = `https://api-m.sandbox.paypal.com/v1/billing/subscriptions/${subscriptionID}`;
    console.log("Verifying subscription at:", url);
    const response = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
        },
    });
    if (!response.ok) {
        const errorText = await response.text();
        console.error("Error verifying subscription:", errorText);
        throw new Error("Failed to verify subscription with PayPal: " + errorText);
    }
    const verificationData = await response.json();
    console.log("Verification data:", verificationData);
    return verificationData;
}
// Express endpoint to save the subscription
const saveSubscription = async (req, res) => {
    try {
        // Destructure required fields from the request body.
        // Note: using `orderId` to match the request payload
        const { businessId, paypalSubId, planId, status, // This can be overridden by verified data
        startDate, nextBillingDate, orderId, } = req.body;
        // Verify the subscription with PayPal using our internal access token
        const verificationData = await verifySubscription(paypalSubId);
        console.log("PayPal verification response:", verificationData);
        // Check if the subscription status from PayPal is ACTIVE
        if (verificationData.status !== "ACTIVE") {
            res.status(400).json({ error: "Subscription verification failed; subscription is not active" });
            return;
        }
        // Optionally update startDate with PayPal's verified start_time if available
        const verifiedStartDate = verificationData.start_time
            ? new Date(verificationData.start_time)
            : startDate
                ? new Date(startDate)
                : new Date();
        // Find business name by businessId
        const businessRecord = await prisma.business.findUnique({
            where: { id: businessId },
            select: { businessName: true },
        });
        if (!businessRecord) {
            res.status(404).json({ error: "Business not found" });
            return;
        }
        // Create a new subscription record in the database.
        const subscription = await prisma.subscription.create({
            data: {
                businessId, // Foreign key linking to the Business model
                businessName: businessRecord.businessName,
                paypalSubId, // PayPal subscription ID
                planId, // PayPal plan ID
                orderId, // Now using the correct field from the request
                facilitatorAccessToken: "", // Optionally leave this empty if not needed
                status: verificationData.status, // Use the verified status (e.g., "ACTIVE")
                startDate: verifiedStartDate, // Use the verified start time if available
                nextBillingDate: nextBillingDate ? new Date(nextBillingDate) : null,
            },
        });
        res.status(201).json(subscription);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        res.status(500).json({ error: "Error saving subscription", details: errorMessage });
    }
};
exports.saveSubscription = saveSubscription;
const getSubscriptions = async (req, res) => {
    try {
        const subscriptions = await prisma.subscription.findMany({
            // Optionally, add ordering or filtering here
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json(subscriptions);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        res.status(500).json({ error: "Error fetching subscriptions", details: errorMessage });
    }
};
exports.getSubscriptions = getSubscriptions;
const getSubscriptionsByBusinessId = async (req, res) => {
    try {
        // Extract the business ID from the URL parameters.
        const { businessId } = req.params;
        if (!businessId) {
            res.status(400).json({ error: "Business ID is required" });
        }
        // Convert businessId to a number (assuming your business.id is an integer).
        const id = Number(businessId);
        if (isNaN(id)) {
            res.status(400).json({ error: "Invalid business ID" });
            return;
        }
        // Fetch subscriptions related to the business.
        const subscriptions = await prisma.subscription.findMany({
            where: { businessId: id },
            orderBy: { createdAt: "desc" },
        });
        res.status(200).json(subscriptions);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        res.status(500).json({ error: "Error fetching subscriptions", details: errorMessage });
    }
};
exports.getSubscriptionsByBusinessId = getSubscriptionsByBusinessId;
const createSubscription = async (req, res) => {
    try {
        const clientId = process.env.PAYPAL_CLIENT_ID;
        const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
        const planId = process.env.PAYPAL_PLAN_ID; // make sure it's set in your .env
        const returnUrl = "yourapp://paypal-success";
        const cancelUrl = "yourapp://paypal-cancel";
        const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
        // Step 1: Get PayPal access token
        const tokenRes = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
            method: "POST",
            headers: {
                Authorization: `Basic ${basicAuth}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: "grant_type=client_credentials",
        });
        if (!tokenRes.ok) {
            const errorText = await tokenRes.text();
            res.status(500).json({ error: "Failed to get access token", details: errorText });
            return;
        }
        const { access_token } = await tokenRes.json();
        // Step 2: Create subscription
        const subRes = await fetch("https://api-m.sandbox.paypal.com/v1/billing/subscriptions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${access_token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                plan_id: planId,
                application_context: {
                    brand_name: "YourAppName",
                    locale: "en-US",
                    shipping_preference: "NO_SHIPPING",
                    user_action: "SUBSCRIBE_NOW",
                    return_url: returnUrl,
                    cancel_url: cancelUrl,
                },
            }),
        });
        if (!subRes.ok) {
            const errorText = await subRes.text();
            res.status(500).json({ error: "Failed to create subscription", details: errorText });
            return;
        }
        const subData = await subRes.json();
        const approvalUrl = subData.links?.find((link) => link.rel === "approve")?.href;
        if (!approvalUrl) {
            res.status(500).json({ error: "No approval URL found in PayPal response" });
            return;
        }
        res.status(200).json({ url: approvalUrl });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        res.status(500).json({ error: "Error creating PayPal subscription", details: errorMessage });
    }
};
exports.createSubscription = createSubscription;
