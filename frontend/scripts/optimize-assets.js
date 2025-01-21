const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');
const { gzip } = require('zlib');
const { promisify } = require('util');
const imagemin = require('imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');
const imageminSvgo = require('imagemin-svgo');
const { minify } = require('terser');
const CleanCSS = require('clean-css');

const gzipAsync = promisify(gzip);

// Configuration
const config = {
  dist: path.join(__dirname, '../dist'),
  quality: {
    jpeg: 80,
    png: [0.6, 0.8],
    webp: 75,
  },
  maxWidth: {
    thumbnail: 200,
    preview: 800,
    full: 1920,
  },
};

// Helper to get all files recursively
async function getFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async entry => {
      const fullPath = path.join(dir, entry.name);
      return entry.isDirectory() ? getFiles(fullPath) : fullPath;
    })
  );
  return files.flat();
}

// Optimize images
async function optimizeImages(files) {
  console.log('Optimizing images...');

  const imageFiles = files.filter(file => /\.(jpg|jpeg|png|svg)$/i.test(file));

  for (const file of imageFiles) {
    const ext = path.extname(file).toLowerCase();
    const filename = path.basename(file, ext);
    const dir = path.dirname(file);

    // Original optimization
    if (ext === '.svg') {
      await imagemin([file], {
        destination: dir,
        plugins: [
          imageminSvgo({
            plugins: [
              { name: 'removeViewBox', active: false },
              { name: 'removeDimensions', active: true },
            ],
          }),
        ],
      });
    } else {
      const image = sharp(file);
      const metadata = await image.metadata();

      // JPEG/PNG optimization
      if (ext === '.jpg' || ext === '.jpeg') {
        await image
          .jpeg({ quality: config.quality.jpeg })
          .toFile(path.join(dir, `${filename}.jpg`));
      } else if (ext === '.png') {
        await image
          .png({ quality: config.quality.png[0] * 100 })
          .toFile(path.join(dir, `${filename}.png`));
      }

      // Generate WebP version
      await image
        .webp({ quality: config.quality.webp })
        .toFile(path.join(dir, `${filename}.webp`));

      // Generate responsive sizes if image is large enough
      if (metadata.width > config.maxWidth.thumbnail) {
        const sizes = Object.entries(config.maxWidth).filter(
          ([_, width]) => width < metadata.width
        );

        for (const [size, width] of sizes) {
          await image
            .resize(width, null, { withoutEnlargement: true })
            .jpeg({ quality: config.quality.jpeg })
            .toFile(path.join(dir, `${filename}-${size}.jpg`));

          await image
            .resize(width, null, { withoutEnlargement: true })
            .webp({ quality: config.quality.webp })
            .toFile(path.join(dir, `${filename}-${size}.webp`));
        }
      }
    }
  }
}

// Minify JavaScript
async function minifyJS(files) {
  console.log('Minifying JavaScript...');

  const jsFiles = files.filter(
    file => file.endsWith('.js') && !file.includes('.min.')
  );

  for (const file of jsFiles) {
    const code = await fs.readFile(file, 'utf8');
    const minified = await minify(code, {
      compress: {
        dead_code: true,
        drop_console: true,
        drop_debugger: true,
        keep_fnames: false,
        passes: 2,
      },
      mangle: {
        toplevel: true,
      },
      output: {
        comments: false,
      },
    });

    await fs.writeFile(file, minified.code);
  }
}

// Minify CSS
async function minifyCSS(files) {
  console.log('Minifying CSS...');

  const cssFiles = files.filter(
    file => file.endsWith('.css') && !file.includes('.min.')
  );
  const cleanCSS = new CleanCSS({
    level: {
      1: {
        all: true,
      },
      2: {
        all: true,
        removeUnusedAtRules: true,
        restructureRules: true,
      },
    },
  });

  for (const file of cssFiles) {
    const css = await fs.readFile(file, 'utf8');
    const minified = cleanCSS.minify(css);
    await fs.writeFile(file, minified.styles);
  }
}

// Compress files
async function compressFiles(files) {
  console.log('Compressing files...');

  const compressible = files.filter(file =>
    /\.(js|css|html|svg|json|txt|xml)$/i.test(file)
  );

  for (const file of compressible) {
    const content = await fs.readFile(file);
    const compressed = await gzipAsync(content);
    await fs.writeFile(`${file}.gz`, compressed);
  }
}

// Main optimization function
async function optimizeAssets() {
  try {
    console.log('Starting asset optimization...');

    // Get all files in dist directory
    const files = await getFiles(config.dist);

    // Run optimizations in parallel
    await Promise.all([
      optimizeImages(files),
      minifyJS(files),
      minifyCSS(files),
      compressFiles(files),
    ]);

    console.log('Asset optimization complete!');
  } catch (error) {
    console.error('Error during optimization:', error);
    process.exit(1);
  }
}

// Run optimization
optimizeAssets();
