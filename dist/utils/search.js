"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSearchVariations = void 0;
const generateSearchVariations = (query) => {
    const variations = new Set();
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
exports.generateSearchVariations = generateSearchVariations;
