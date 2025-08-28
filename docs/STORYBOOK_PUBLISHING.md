# 🚀 Free Storybook Publishing Guide

This guide shows you how to publish your EmpiRE-Compass Storybook for **free** using various platforms.

## 📋 Quick Setup Checklist

- [ ] Storybook builds successfully locally
- [ ] All components have proper stories
- [ ] Documentation is complete
- [ ] GitHub repository is up to date

## 🎯 Publishing Options (All Free!)

### 1. 🌟 **Chromatic** (Recommended)

**Best for: Professional teams, visual testing, and collaboration**

#### Setup:

```bash
# Install Chromatic
npm install --save-dev chromatic

# Sign up at https://www.chromatic.com (free tier available)
# Get your project token

# Add to package.json scripts:
"chromatic": "chromatic --exit-zero-on-changes"

# Publish
npm run chromatic -- --project-token=YOUR_TOKEN
```

#### Features:

- ✅ **Free tier**: 5,000 snapshots/month
- ✅ **Visual regression testing**
- ✅ **Review & collaboration tools**
- ✅ **Custom domain**
- ✅ **PR integration**

#### GitHub Action:

```yaml
# .github/workflows/chromatic.yml
name: 'Chromatic'
on: push

jobs:
  chromatic-deployment:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build-storybook
      - uses: chromaui/action@v1
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
```

### 2. 🔥 **Firebase Hosting**

**Best for: Google ecosystem integration**

#### Setup:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and initialize
firebase login
firebase init hosting

# Build Storybook
npm run build-storybook

# Deploy
firebase deploy --only hosting
```

#### Configuration (`firebase.json`):

```json
{
  "hosting": {
    "public": "storybook-static",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

#### Features:

- ✅ **Free tier**: 10GB storage, 10GB/month transfer
- ✅ **Custom domain**
- ✅ **SSL certificates**
- ✅ **Global CDN**

### 3. ⚡ **Vercel**

**Best for: Jamstack deployment and Next.js integration**

#### Setup:

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Or connect GitHub repository at https://vercel.com
```

#### Configuration (`vercel.json`):

```json
{
  "buildCommand": "npm run build-storybook",
  "outputDirectory": "storybook-static",
  "framework": null
}
```

#### Features:

- ✅ **Free tier**: Unlimited personal projects
- ✅ **Automatic deployments**
- ✅ **Custom domain**
- ✅ **Edge functions**

### 4. 🐙 **GitHub Pages**

**Best for: Open source projects**

#### Setup via GitHub Actions:

```yaml
# .github/workflows/storybook.yml
name: Build and Deploy Storybook
on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build Storybook
        run: npm run build-storybook

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './storybook-static'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

#### Features:

- ✅ **Completely free**
- ✅ **Custom domain** (username.github.io/repo)
- ✅ **Automatic deployments**
- ✅ **Open source friendly**

### 5. 🌐 **Netlify**

**Best for: Static sites with advanced features**

#### Setup:

```bash
# Build Storybook
npm run build-storybook

# Deploy via drag-and-drop at https://netlify.com
# Or connect GitHub repository
```

#### Configuration (`netlify.toml`):

```toml
[build]
  publish = "storybook-static"
  command = "npm run build-storybook"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### Features:

- ✅ **Free tier**: 100GB bandwidth/month
- ✅ **Form handling**
- ✅ **Serverless functions**
- ✅ **Split testing**

## 📦 Enhanced Package.json Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "storybook:build": "npm run build-storybook",
    "storybook:serve": "npx http-server storybook-static -p 8080",
    "deploy:chromatic": "chromatic --exit-zero-on-changes",
    "deploy:firebase": "npm run build-storybook && firebase deploy --only hosting",
    "deploy:vercel": "npm run build-storybook && vercel --prod",
    "deploy:surge": "npm run build-storybook && surge storybook-static",
    "preview:storybook": "npm run build-storybook && npm run storybook:serve"
  }
}
```

## 🎨 Custom Branding

### Add Custom Logo:

```typescript
// .storybook/manager.js
import { addons } from '@storybook/manager-api';
import { create } from '@storybook/theming/create';

const theme = create({
  base: 'light',
  brandTitle: 'EmpiRE-Compass Design System',
  brandUrl: 'https://github.com/okarras/EmpiRE-Compass',
  brandImage: './logo.png',
  brandTarget: '_self',

  colorPrimary: '#c0392b',
  colorSecondary: '#2c3e50',

  appBg: '#ffffff',
  appContentBg: '#ffffff',
  appBorderColor: '#e9ecef',
  appBorderRadius: 4,

  fontBase: '"Roboto", sans-serif',
  fontCode: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace',

  textColor: '#212529',
  textInverseColor: '#ffffff',

  barTextColor: '#73788D',
  barSelectedColor: '#c0392b',
  barBg: '#ffffff',

  inputBg: '#ffffff',
  inputBorder: '#ced4da',
  inputTextColor: '#212529',
  inputBorderRadius: 4,
});

addons.setConfig({
  theme,
});
```

## 🚀 Deployment Comparison

| Platform         | Cost      | Build Time | Custom Domain | SSL | CDN | Analytics |
| ---------------- | --------- | ---------- | ------------- | --- | --- | --------- |
| **Chromatic**    | Free/Paid | Fast       | ✅            | ✅  | ✅  | ✅        |
| **Firebase**     | Free/Paid | Fast       | ✅            | ✅  | ✅  | ✅        |
| **Vercel**       | Free/Paid | Very Fast  | ✅            | ✅  | ✅  | ✅        |
| **GitHub Pages** | Free      | Medium     | ✅\*          | ✅  | ❌  | ❌        |
| **Netlify**      | Free/Paid | Fast       | ✅            | ✅  | ✅  | ✅        |

\*Custom domain available for GitHub Pages

## 🎯 Recommended Setup

For **EmpiRE-Compass**, I recommend this setup:

1. **Primary**: **Chromatic** for professional deployment and visual testing
2. **Backup**: **GitHub Pages** for open-source community access
3. **Development**: **Vercel** for preview deployments

### Implementation:

```bash
# 1. Setup Chromatic (main)
npm run deploy:chromatic

# 2. Setup GitHub Pages (backup)
# Use the GitHub Action above

# 3. Setup Vercel (previews)
vercel --prod
```

## 🔧 Automation

### Complete CI/CD Pipeline:

```yaml
# .github/workflows/storybook-deploy.yml
name: Deploy Storybook

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  chromatic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run chromatic
        env:
          CHROMATIC_PROJECT_TOKEN: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}

  github-pages:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    needs: chromatic
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build-storybook
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./storybook-static
```

## 🎉 Success!

Once deployed, your Storybook will be available at:

- **Chromatic**: `https://your-project-id.chromatic.com`
- **Firebase**: `https://your-project.web.app`
- **Vercel**: `https://your-project.vercel.app`
- **GitHub Pages**: `https://username.github.io/repository-name`
- **Netlify**: `https://your-project.netlify.app`

Your design system is now live and accessible to everyone! 🚀
