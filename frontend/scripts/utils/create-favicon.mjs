import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputPath = path.join(__dirname, "../public/favicon.svg");
const outputPath = path.join(__dirname, "../public/favicon.ico");

// Create scripts directory if it doesn't exist
try {
  await fs.access(__dirname);
} catch {
  await fs.mkdir(__dirname, { recursive: true });
}

// Convert SVG to ICO (32x32 pixels)
try {
  const buffer = await sharp(inputPath)
    .resize(32, 32)
    .toFormat("png")
    .toBuffer();

  await fs.writeFile(outputPath, buffer);
  console.log("Favicon created successfully!");
} catch (err) {
  console.error("Error creating favicon:", err);
}
