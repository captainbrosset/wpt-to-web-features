import { glob } from 'glob';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import yaml from 'js-yaml';

const WPT_FOLDER = 'wpt';
const WEB_FEATURES_FILE_NAME = 'WEB_FEATURES.yml';
const OUTPUT_FILE = 'wpt-web-features.json';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function findWebFeaturesFiles() {
  try {
    console.log('Searching for WEB_FEATURES.yml files in the wpt directory...');
    const pattern = path.join(__dirname, WPT_FOLDER, `**/${WEB_FEATURES_FILE_NAME}`);
    const files = await glob(pattern);

    if (files.length === 0) {
      console.log('No WEB_FEATURES.yml files found in the wpt directory.');
      return [];
    }

    return files;
  } catch (error) {
    console.error('Error searching for WEB_FEATURES.yml files:', error);
    return [];
  }
}

async function parseYamlFile(file) {
  try {
    console.log(`Parsing file: ${file}`);
    const content = await fs.readFile(file, 'utf8');
    const parsedContent = yaml.load(content);

    return parsedContent;
  } catch (error) {
    console.error(`Error reading or parsing file ${file}:`, error.message);
    throw new Error(`Failed to parse YAML file: ${file}`);
  }
}

async function main() {
  const webFeatureFiles = await findWebFeaturesFiles();
  console.log(`Found ${webFeatureFiles.length} WEB_FEATURES.yml file(s)`);

  const webFeatures = {};

  for (const file of webFeatureFiles) {
    const parsedContent = await parseYamlFile(file);
    const relativePath = path.relative(path.join(__dirname, WPT_FOLDER), file);
    
    for (const feature of parsedContent.features) {
      if (!webFeatures[feature.name]) {
        webFeatures[feature.name] = [];
      }
      webFeatures[feature.name].push({
        testPath: relativePath.replace(`/${WEB_FEATURES_FILE_NAME}`, ''),
        testFiles: feature.files
      });
    }
  }

  console.log(`\nSuccessfully parsed ${webFeatures.length} out of ${webFeatureFiles.length} files`);
  
  // Write the web features to a JSON file
  try {
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(webFeatures, null, 2));
    console.log(`Web features written to ${OUTPUT_FILE}`);
  } catch (error) {
    console.error(`Error writing to ${OUTPUT_FILE}:`, error.message);
  }
}

main();