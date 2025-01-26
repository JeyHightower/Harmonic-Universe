import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

const SOURCE_ICON = "src/assets/logo.png";
const ICONS_OUTPUT_DIR = "public/assets/icons";
const SPLASH_OUTPUT_DIR = "public/assets/splash";

// Icon sizes needed for PWA
const ICON_SIZES = [
  72,
  96,
  128,
  144,
  152,
  192,
  384,
  512,
  // Additional sizes for Apple
  180, // Apple touch icon
  196, // Favicon
];

// Splash screen configurations
const SPLASH_SCREENS = [
  // iPad Pro 12.9"
  {
    width: 2048,
    height: 2732,
    name: "apple-splash-2048-2732",
    orientation: "portrait",
  },
  {
    width: 2732,
    height: 2048,
    name: "apple-splash-2732-2048",
    orientation: "landscape",
  },
  // iPad Pro 11"
  {
    width: 1668,
    height: 2388,
    name: "apple-splash-1668-2388",
    orientation: "portrait",
  },
  {
    width: 2388,
    height: 1668,
    name: "apple-splash-2388-1668",
    orientation: "landscape",
  },
  // iPad Air
  {
    width: 1640,
    height: 2360,
    name: "apple-splash-1640-2360",
    orientation: "portrait",
  },
  {
    width: 2360,
    height: 1640,
    name: "apple-splash-2360-1640",
    orientation: "landscape",
  },
  // iPad Mini
  {
    width: 1536,
    height: 2048,
    name: "apple-splash-1536-2048",
    orientation: "portrait",
  },
  {
    width: 2048,
    height: 1536,
    name: "apple-splash-2048-1536",
    orientation: "landscape",
  },
  // iPhone 14 Pro Max
  {
    width: 1290,
    height: 2796,
    name: "apple-splash-1290-2796",
    orientation: "portrait",
  },
  {
    width: 2796,
    height: 1290,
    name: "apple-splash-2796-1290",
    orientation: "landscape",
  },
  // iPhone 14 Pro
  {
    width: 1179,
    height: 2556,
    name: "apple-splash-1179-2556",
    orientation: "portrait",
  },
  {
    width: 2556,
    height: 1179,
    name: "apple-splash-2556-1179",
    orientation: "landscape",
  },
  // iPhone 14
  {
    width: 1170,
    height: 2532,
    name: "apple-splash-1170-2532",
    orientation: "portrait",
  },
  {
    width: 2532,
    height: 1170,
    name: "apple-splash-2532-1170",
    orientation: "landscape",
  },
];

async function ensureDirectoryExists(dir) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function generateIcons() {
  console.log("Generating icons...");
  await ensureDirectoryExists(ICONS_OUTPUT_DIR);

  const sourceBuffer = await fs.readFile(SOURCE_ICON);

  for (const size of ICON_SIZES) {
    const outputPath = path.join(ICONS_OUTPUT_DIR, `icon-${size}x${size}.png`);
    await sharp(sourceBuffer).resize(size, size).png().toFile(outputPath);
    console.log(`Generated ${outputPath}`);
  }

  // Generate special icons
  // Favicon
  await sharp(sourceBuffer)
    .resize(196, 196)
    .png()
    .toFile(path.join(ICONS_OUTPUT_DIR, "favicon-196.png"));

  // Apple touch icon
  await sharp(sourceBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(ICONS_OUTPUT_DIR, "apple-icon-180.png"));

  // Badge
  await sharp(sourceBuffer)
    .resize(72, 72)
    .png()
    .toFile(path.join(ICONS_OUTPUT_DIR, "badge-72x72.png"));

  console.log("Icon generation complete!");
}

async function generateSplashScreens() {
  console.log("Generating splash screens...");
  await ensureDirectoryExists(SPLASH_OUTPUT_DIR);

  const sourceBuffer = await fs.readFile(SOURCE_ICON);
  const logoSize = Math.min(
    512,
    Math.min(...SPLASH_SCREENS.map((s) => Math.min(s.width, s.height))) / 2,
  );

  for (const screen of SPLASH_SCREENS) {
    const { width, height, name } = screen;

    // Create a new image with background color
    const image = sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 26, g: 26, b: 26, alpha: 1 }, // #1a1a1a
      },
    });

    // Resize and center the logo
    const logo = await sharp(sourceBuffer)
      .resize(logoSize, logoSize)
      .toBuffer();

    // Composite the logo onto the background
    await image
      .composite([
        {
          input: logo,
          top: Math.floor((height - logoSize) / 2),
          left: Math.floor((width - logoSize) / 2),
        },
      ])
      .png()
      .toFile(path.join(SPLASH_OUTPUT_DIR, `${name}.png`));

    console.log(`Generated ${name}.png`);
  }

  console.log("Splash screen generation complete!");
}

async function main() {
  try {
    await generateIcons();
    await generateSplashScreens();
    console.log("All assets generated successfully!");
  } catch (error) {
    console.error("Error generating assets:", error);
    process.exit(1);
  }
}

main();
