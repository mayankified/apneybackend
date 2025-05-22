export const generateSearchVariations = (query: string): string[] => {
    const variations = new Set<string>();
  
    // Original query
    variations.add(query);
  
    // Split on common word boundaries (heuristic)
    const words = query.replace(/([a-z])([A-Z])/g, "$1 $2").split(/(?=[A-Z])|\d+|_/);
  
    if (words.length > 1) {
      variations.add(words.join(" ")); // "chickenbiryani" -> "chicken biryani"
      variations.add(words.join("")); // Remove spaces if present
    }
  
    return Array.from(variations);
  };