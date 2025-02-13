import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function generateBusinessId(ownerName: string, city: string): Promise<string> {
  // Step 1: Get the first 3 letters of the owner's name
  const ownerInitials = ownerName.substring(0, 3).toUpperCase();

  // Step 2: Generate city initials dynamically
  const cityWords = city.split(" ");
  const cityInitials = cityWords.length > 1
    ? cityWords.map(word => word[0]).join("").toUpperCase()  // Take first letter of each word
    : city.substring(0, 2).toUpperCase();  // Take first two letters for single-word cities

  // Step 3: Find the highest number used for businesses in this city
  const lastBusiness = await prisma.business.findFirst({
    where: { city },
    orderBy: { businessId: "desc" }, // Get latest business ID in the city
    select: { businessId: true },
  });

  // Extract the last number (e.g., "AMA-FR-01" → 01)
  let nextNumber = 1;
  if (lastBusiness?.businessId) {
    const match = lastBusiness.businessId.match(/\d+$/);
    if (match) {
      nextNumber = parseInt(match[0]) + 1;
    }
  }

  // Step 4: Format the business ID
  const businessId = `V-${ownerInitials}-${cityInitials}-${String(nextNumber).padStart(2, "0")}`;

  return businessId;
}


// createBusiness();
