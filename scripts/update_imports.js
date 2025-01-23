import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const updateImports = filePath => {
  const content = fs.readFileSync(filePath, 'utf8');

  // Update config imports
  let updatedContent = content.replace(
    /from ['"]\.\.\/config\/(.*?)['"]/g,
    "from '../../../config/$1'"
  );

  // Update relative imports for moved files
  updatedContent = updatedContent.replace(
    /from ['"]\.\.\/services\/(.*?)['"]/g,
    "from '../../services/$1'"
  );

  updatedContent = updatedContent.replace(
    /from ['"]\.\.\/store\/(.*?)['"]/g,
    "from '../../store/$1'"
  );

  updatedContent = updatedContent.replace(
    /from ['"]\.\.\/components\/(.*?)['"]/g,
    "from '../../components/$1'"
  );

  if (content !== updatedContent) {
    fs.writeFileSync(filePath, updatedContent);
    console.log(`Updated imports in ${filePath}`);
  }
};

const walkDir = dir => {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.match(/\.(js|jsx|ts|tsx)$/)) {
      updateImports(filePath);
    }
  });
};

// Start updating from frontend/src
walkDir(path.join(__dirname, '../frontend/src'));
