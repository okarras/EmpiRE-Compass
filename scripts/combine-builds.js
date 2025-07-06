import fs from 'fs';
import path from 'path';

// Function to copy directory recursively
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('🔧 Combining builds...');

// Ensure dist directory exists
if (!fs.existsSync('dist')) {
  console.error('❌ Main app build not found. Run "npm run build" first.');
  process.exit(1);
}

// Ensure storybook-static directory exists
if (!fs.existsSync('storybook-static')) {
  console.error(
    '❌ Storybook build not found. Run "npm run build-storybook" first.'
  );
  process.exit(1);
}

// Copy Storybook build to dist/storybook
const storybookDest = path.join('dist', 'storybook');
console.log('📚 Copying Storybook to /storybook...');
copyDir('storybook-static', storybookDest);

// Create a simple navigation file to help users discover Storybook
const navigationHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>EmpiRE-Compass Documentation</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .card {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin: 20px 0;
    }
    h1 { color: #c0392b; }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      margin: 10px 10px 10px 0;
      background: #c0392b;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      transition: background 0.3s;
    }
    .btn:hover { background: #a93226; }
    .btn.secondary { background: #2c3e50; }
    .btn.secondary:hover { background: #1a252f; }
  </style>
</head>
<body>
  <div class="card">
    <h1>🧭 EmpiRE-Compass</h1>
    <p>Welcome to the EmpiRE-Compass project. Choose where you'd like to go:</p>
    
    <a href="/" class="btn">📊 Open Dashboard</a>
    <a href="/storybook" class="btn secondary">📚 View Storybook</a>
    
    <h2>About</h2>
    <p>This deployment includes both the main EmpiRE-Compass dashboard and its component documentation via Storybook.</p>
    
    <ul>
      <li><strong>Dashboard:</strong> Interactive data visualization and analysis tool</li>
      <li><strong>Storybook:</strong> Component library and documentation</li>
    </ul>
  </div>
</body>
</html>
`;

// Write navigation file
fs.writeFileSync(path.join('dist', 'docs.html'), navigationHTML);

console.log('✅ Build combination complete!');
console.log('📁 Main app: /');
console.log('📚 Storybook: /storybook');
console.log('📖 Navigation: /docs.html');
