#!/usr/bin/env node

/**
 * This script downloads the all-MiniLM-L6-v2 model files to public/models
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';
const BASE_URL = 'https://huggingface.co/Xenova/all-MiniLM-L6-v2/resolve/main';
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'models', 'all-MiniLM-L6-v2');

const FILES_TO_DOWNLOAD = [
  'config.json',
  'tokenizer.json',
  'tokenizer_config.json',
  'onnx/model_quantized.onnx',
];

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const onnxDir = path.join(OUTPUT_DIR, 'onnx');
if (!fs.existsSync(onnxDir)) {
  fs.mkdirSync(onnxDir, { recursive: true });
}

console.log('Downloading embedding model files...');
console.log(`Model: ${MODEL_NAME}`);
console.log(`Output: ${OUTPUT_DIR}\n`);

let completed = 0;
let failed = 0;

function downloadFile(filename) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}/${filename}`;
    const outputPath = path.join(OUTPUT_DIR, filename);
    
    console.log(`Downloading: ${filename}`);
    
    https.get(url, { headers: { 'User-Agent': 'Node.js' } }, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        https.get(response.headers.location, (redirectResponse) => {
          const file = fs.createWriteStream(outputPath);
          let downloadedSize = 0;
          const totalSize = parseInt(redirectResponse.headers['content-length'], 10);
          
          redirectResponse.on('data', (chunk) => {
            downloadedSize += chunk.length;
            const progress = ((downloadedSize / totalSize) * 100).toFixed(1);
            process.stdout.write(`\r   Progress: ${progress}% (${(downloadedSize / 1024 / 1024).toFixed(2)} MB)`);
          });
          
          redirectResponse.pipe(file);
          
          file.on('finish', () => {
            file.close();
            console.log(`\nDownloaded: ${filename}\n`);
            completed++;
            resolve();
          });
        }).on('error', (err) => {
          fs.unlink(outputPath, () => {});
          console.error(`\nFailed: ${filename} - ${err.message}\n`);
          failed++;
          reject(err);
        });
      } else {
        const file = fs.createWriteStream(outputPath);
        let downloadedSize = 0;
        const totalSize = parseInt(response.headers['content-length'], 10);
        
        response.on('data', (chunk) => {
          downloadedSize += chunk.length;
          if (totalSize) {
            const progress = ((downloadedSize / totalSize) * 100).toFixed(1);
            process.stdout.write(`\r   Progress: ${progress}% (${(downloadedSize / 1024 / 1024).toFixed(2)} MB)`);
          }
        });
        
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          console.log(`\nDownloaded: ${filename}\n`);
          completed++;
          resolve();
        });
      }
    }).on('error', (err) => {
      fs.unlink(outputPath, () => {});
      console.error(`\nFailed: ${filename} - ${err.message}\n`);
      failed++;
      reject(err);
    });
  });
}

async function downloadAll() {
  for (const file of FILES_TO_DOWNLOAD) {
    try {
      await downloadFile(file);
    } catch (err) {
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`Completed: ${completed}/${FILES_TO_DOWNLOAD.length}`);
  if (failed > 0) {
    console.log(`Failed: ${failed}/${FILES_TO_DOWNLOAD.length}`);
  }
  console.log('='.repeat(50));
  
  if (completed === FILES_TO_DOWNLOAD.length) {
    console.log('\nAll model files downloaded successfully!');
    console.log('The model will now be bundled with your app.');
  } else {
    console.log('\nSome files failed to download. The app will fall back to CDN.');
    process.exit(1);
  }
}

downloadAll();
