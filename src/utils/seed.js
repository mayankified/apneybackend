const fs = require('fs');
const csv = require('csv-parser');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['info', 'warn', 'error'],
});
const filePath = './src/utils/bus.csv'; // CSV file path
const checkpointFile = './src/utils/checkpoint.json'; // Checkpoint file path
const BATCH_SIZE = 50; // Number of inserts per batch to avoid timeouts

// Function to read checkpoint
function readCheckpoint() {
  if (fs.existsSync(checkpointFile)) {
    const checkpointData = fs.readFileSync(checkpointFile);
    return JSON.parse(checkpointData).lastInsertedIndex || 0;
  }
  return 0;
}

// Function to write checkpoint
function writeCheckpoint(index) {
  fs.writeFileSync(checkpointFile, JSON.stringify({ lastInsertedIndex: index }));
}

// Function to insert data sequentially in batches
async function batchInsertData(dataArray) {
  let lastInsertedIndex = readCheckpoint();
  console.log(`Resuming import from index: ${lastInsertedIndex}\n`);

  // Insert data in batches
  for (let i = lastInsertedIndex; i < dataArray.length; i++) {
    const business = dataArray[i];

    console.log(`Inserting business at index ${i}: ${business.businessName}`);

    try {
      await prisma.business.create({
        data: {
          businessName: business.businessName,
          phoneNumber: business.phoneNumber,
          streetaddress: business.streetaddress,
          city: business.city,
          state: business.state,
          zipcode: business.zipcode,
          country: business.country,
          address: business.address,
          longitude: business.longitude,
          latitude: business.latitude,
          imageUrls: business.imageUrls,
          websiteUrl: business.websiteUrl,
          category: business.category,
          reviews: {}, // No reviews initially
          keywords: {
            connectOrCreate: business.keywords.map((keyword) => ({
              where: { name: keyword.trim() },
              create: {
                name: keyword.trim(),
                slug: keyword.trim().toLowerCase().replace(/ /g, '-'),
              },
            })),
          },
        },
      });

      console.log(`Successfully inserted: ${business.businessName}`);
      writeCheckpoint(i); // Save checkpoint after successful insert

    } catch (error) {
      console.error(`Error inserting ${business.businessName} at index ${i}:`, error);
      console.log('Retrying after a short delay...');
      await delay(5000); // Wait before retrying
      i--; // Retry the same record
    }
  }

  console.log('All businesses imported successfully!');
  if (fs.existsSync(checkpointFile)) {
    fs.unlinkSync(checkpointFile); // Remove checkpoint after successful import
  }
}

// Main import function
async function importCsv() {
  const businesses = [];
  console.log(`Reading CSV file from: ${filePath}`);

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
      const imageUrls = parseJsonString(row.imageUrls);
      const keywords = parseJsonString(row.keyword);

      businesses.push({
        businessName: row.businessName,
        phoneNumber: row.phoneNumber || null,
        streetaddress: row.streetaddress || null,
        city: row.city || null,
        state: row.state || null,
        zipcode: row.zipcode || null,
        country: row.country || null,
        address: row.address || null,
        longitude: parseFloat(row.longitude) || null,
        latitude: parseFloat(row.latitude) || null,
        imageUrls: imageUrls || [],
        websiteUrl: row.websiteUrl || null,
        category: row.category || null,
        keywords: keywords || [],
      });
    })
    .on('end', async () => {
      console.log(`CSV file processed. Total businesses parsed: ${businesses.length}`);
      console.log('Starting import...\n');

      try {
        await batchInsertData(businesses);
      } catch (error) {
        console.error('Error during import:', error);
      } finally {
        await prisma.$disconnect();
      }
    })
    .on('error', (error) => {
      console.error('Error reading CSV file:', error);
      prisma.$disconnect();
      process.exit(1);
    });
}

// Helper function to parse JSON-like fields from CSV
function parseJsonString(str) {
  if (!str || str.trim() === '') return [];
  try {
    const cleanedStr = str.trim().replace(/^{/, '[').replace(/}$/, ']').replace(/""/g, '"');
    return JSON.parse(cleanedStr);
  } catch (error) {
    console.warn(`Failed to parse JSON: "${str}". Returning empty array.`);
    return [];
  }
}

// Helper function to add delay
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Start CSV import
importCsv().catch((error) => {
  console.error('Error importing CSV:', error);
  prisma.$disconnect();
  process.exit(1);
});
