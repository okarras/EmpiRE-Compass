<a id='top'></a>
<div align="center">
  <a href="https://github.com/okarras/EmpiRE-Compass">
    <img src="logo.png" alt="Logo" width="500" height="250">
  </a>

<h2 align="center" style="font-weight: normal">EmpiRE-Compass<br/>
<i>"Navigating the Landscape of Empirical Research in Requirements Engineering"</i></h2><br/>

[![GitHub - Project](https://img.shields.io/badge/GitHub-Project-2ea44f)](https://github.com/okarras/EmpiRE-Compass) [![Issues - Bug Report](https://img.shields.io/badge/Issues-Bug_Report-2ea44f)](https://github.com/okarras/EmpiRE-Compass/issues) [![Issues - Feature Request](https://img.shields.io/badge/Issues-Feature_Request-2ea44f)](https://github.com/okarras/EmpiRE-Compass/issues) [![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/okarras/EmpiRE-Compass/HEAD) 
[![ORKG - KG-EmpiRE](https://img.shields.io/badge/ORKG-KG--EmpiRE-e86161)](https://orkg.org/observatory/Empirical_Software_Engineering?sort=combined&classesFilter=Paper,Comparison,Visualization)
[![ORKG - RDF dump](https://img.shields.io/badge/ORKG-RDF_dump-e86161)](https://orkg.org/api/rdf/dump)
</div>

---

EmpiRE-Compass is a neuro-symbolic dashboard that facilitates the exploration, replication, and reuse of empirical research knowledge of **KG-EmpiRE** – a community-maintainable knowledge graph on the state and evolution of empirical research in requirements engineering.  
By leveraging live data of KG-EmpiRE stored in the **Open Research Knowledge Graph (ORKG)**, EmpiRE-Compass offers researchers a suite of tools for data visualization, comparative analysis, and structured data contribution.

## Table of Contents

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Getting Started](#getting-started)
   1. [Prerequisites](#prerequisites)
   2. [Installation](#installation)
4. [Usage](#usage)
5. [Design System & Storybook](#design-system--storybook)
6. [Firebase Setup](#firebase-setup)
7. [Statistics Automation](#statistics-automation)
8. [License](#license)
9. [Repository Links](#repository-links)

---

## Overview

EmpiRE-Compass serves as a central hub for empirical research data management. It provides interactive diagrams connected to live ORKG data, offers reproducibility and comparison of different KG-EmpiRE states, displays statistics on conferences and papers, and includes a survey-based data contribution workflow for new research submissions. A Study Designer Knowledge Base helps users find similar research and receive design recommendations aligned with ACM standards.

The project includes a comprehensive **Storybook design system** that documents all UI components, making it easy for developers to understand, reuse, and contribute to the component library.

<!-- <p>
  <img src="https://user-images.githubusercontent.com/PLACEHOLDER/demo-screenshot.png" alt="EmpiRE-Compass Screenshot" width="700" />
</p> -->

---

## Key Features

### Dashboard Display

Visualizes 16 competency questions and their answers with interactive diagrams, providing an overview of KG-EmpiRE data.

### Live Interactive Diagrams

Dynamically fetches real-time data from ORKG. Users can click diagram elements to explore related research papers and insights.

### Reproduction & Comparison

Allows reviewing historical published states of KG-EmpiRE and comparing them with the current live data to understand how research evolves.

### Statistics & Metrics

Displays real-time counts of conferences, papers, triples, resources, and literals to keep track of the KG-EmpiRE scope.

### Data Contribution Workflow

Includes a survey system for structured empirical research data submissions (paper DOIs, contact details, etc.), which undergo curator approval before being integrated into ORKG.

### Study Designer Knowledge Base

Helps users identify similar studies and provides design recommendations based on existing empirical research and ACM standards.

---

## Getting Started

### Prerequisites

Node.js (version 14 or higher), a modern web browser, and optionally Git for version control.

### Installation

Clone the repository:

```
git clone https://github.com/okarras/EmpiRE-Compass.git
cd EmpiRE-Compass
```

Install dependencies:

```
npm install
```

or

```
yarn install
```

Start the development server:

```
npm start
```

or

```
yarn start
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## Usage

The dashboard offers an immediate view of 16 competency questions with their answers and corresponding diagrams. Users can interact with the diagrams to navigate through empirical research data and discover relevant papers from ORKG. Historical states of KG-EmpiRE can be reproduced and compared to monitor data evolution. A statistics page displays up-to-date metrics such as the number of conferences, papers, and triples. Authors can submit new data via a survey, providing paper DOIs and research details for curator review. The Study Designer Knowledge Base aids in finding similar research and offers design recommendations aligned with ACM standards.

---

## Design System & Storybook

EmpiRE-Compass includes a comprehensive design system documented in Storybook, providing a complete library of reusable UI components.

### 📚 **Storybook (Component Library)**

**Live Documentation**: [https://your-storybook-url.chromatic.com](https://your-storybook-url.chromatic.com) <!-- TODO: Update with actual Storybook URL -->

### **Component Categories**

- **🏠 Home Components**: Hero sections, feature highlights, contact forms
- **📊 Data Visualization**: Custom charts, statistics cards, interactive graphs
- **🤖 AI Components**: AI assistant interface, chat messages, dynamic questions
- **🔧 Layout Components**: Headers, navigation, responsive containers
- **⚙️ Utility Components**: Loading states, error handling, form elements

### **Technology Stack**

- **React 18** with TypeScript
- **Material-UI** component library
- **Storybook 7** for documentation
- **Chromatic** for visual testing (planned)

### **Local Development**

```bash
# Start Storybook locally
npm run storybook

# Build Storybook for deployment
npm run build-storybook

# Preview built Storybook
npm run preview:storybook
```

### **Deployment to Chromatic**

```bash
# Deploy to Chromatic (requires CHROMATIC_PROJECT_TOKEN)
npm run deploy:chromatic

# Set up Chromatic project token as environment variable
export CHROMATIC_PROJECT_TOKEN=your-token-here
```

**Setup Instructions:**

1. Sign up at [chromatic.com](https://chromatic.com)
2. Create a new project for EmpiRE-Compass
3. Get your project token from the Chromatic dashboard
4. Add the token to your environment variables
5. Run `npm run deploy:chromatic` to publish your Storybook
6. Update the URLs in `Header.tsx` and `README.md` with your Chromatic URL

### **Features**

- 📖 **Interactive Documentation** - Live component examples with controls
- 🎨 **Design Tokens** - Consistent colors, typography, and spacing
- ♿ **Accessibility Testing** - Built-in a11y checks
- 📱 **Responsive Design** - Mobile-first component library
- 🔧 **Developer Tools** - Props controls and code examples

---

## Firebase Setup

EmpiRE-Compass uses Firebase for real-time statistics storage and automatic data updates. Follow these guides to set up Firebase integration:

### Quick Setup (5 minutes)

📋 **[Firebase Quick Setup Guide](docs/FIREBASE_QUICK_SETUP.md)** - Fast-track setup with essential steps

### Detailed Setup

📖 **[Complete Firebase Setup Guide](docs/GITHUB_FIREBASE_SETUP.md)** - Comprehensive guide with troubleshooting

### Firebase Configuration Steps:

1. **Create Firebase Project** - Set up a new project in Firebase Console
2. **Generate Service Account** - Download the service account JSON key
3. **Configure GitHub Secret** - Add `FIREBASE_SERVICE_ACCOUNT_KEY` to repository secrets
4. **Test Integration** - Run the workflow to verify everything works

### Local Development

```bash
# Validate your Firebase JSON file
cd scripts
python validate_firebase_json.py path/to/your/service-account.json

# Test Firebase integration
python firebase_integration.py

# Run statistics update locally
python empire-statistics.py --service_account path/to/service-account.json --limit 5
```

---

## Statistics Automation

EmpiRE-Compass automatically updates statistics using GitHub Actions that run the `empire-statistics.py` script:

### Automated Updates

- **On every commit** to main branch
- **On merged pull requests**
- **Weekly schedule** (Mondays at 6 AM UTC)
- **Manual trigger** via GitHub Actions

### Statistics Collected

- **Paper count** - Total number of papers in KG-EmpiRE
- **Resources & Literals** - RDF resources and literal values
- **Predicates** - RDF predicates and properties
- **Distinct counts** - Unique resources, literals, and predicates
- **Averages** - Mean values per paper
- **Timestamps** - Last update and processing times

### Manual Execution

```bash
# Process all papers and update Firebase
python scripts/empire-statistics.py --service_account path/to/service-account.json

# Test with limited papers
python scripts/empire-statistics.py --limit 10 --service_account path/to/service-account.json

# Skip Firebase update (CSV only)
python scripts/empire-statistics.py --no_firebase
```

### Monitoring

- View execution logs in **GitHub Actions** tab
- Check results in **Firebase Console** → **Firestore Database**
- Download CSV reports from workflow artifacts

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Repository Links

EmpiRE-Compass: [https://github.com/okarras/EmpiRE-Compass](https://github.com/okarras/EmpiRE-Compass)  
EmpiRE-Analysis: [https://github.com/okarras/EmpiRE-Analysis](https://github.com/okarras/EmpiRE-Analysis)  
Storybook (Design System): [https://empire-compass-storybooks.vercel.app/?path=/docs/layout-menudrawer--docs](https://empire-compass-storybooks.vercel.app/?path=/docs/layout-menudrawer--docs) -->
