const MAPBOX_ACCESS_TOKEN =
  "sk.eyJ1IjoibWFuaXNocmF0aG9yZTEyNjciLCJhIjoiY201NDZ0dzhtMmM2NzJxc2ZpNGhmYTU4NSJ9.dfpvkYH9vHe_veCZZm90Kg";

const getCoordinatesFromAddress = async (address) => {
  if (!address) {
    throw new Error("Address is required");
  }

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        address
      )}.json?access_token=${MAPBOX_ACCESS_TOKEN}&limit=1`
    );

    const data = await response.json();

    if (!data?.features?.length) {
      throw new Error("No coordinates found for the given address.");
    }

    const [longitude, latitude] = data.features[0].center;
    return { latitude, longitude };
  } catch (error) {
    console.error("Error fetching coordinates:", error);
    throw new Error("Failed to fetch coordinates.");
  }
};

getCoordinatesFromAddress(
  "Radha palace, behind adajan firestation, Surat, Gujarat, India"
).then((coordinates) => {
  console.log("Coordinates:", coordinates);
});
