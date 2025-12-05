<a id='top'></a>

<div align="center">
  <a href="https://github.com/okarras/EmpiRE-Compass">
    <img src="logo.png" alt="Logo" width="500" height="250">
  </a>

<h2 align="center" style="font-weight: normal">EmpiRE-Compass<br/>
<i>"A Neuro-Symbolic Dashboard for Navigating the Knowledge Landscape of Empirical Research in Requirements Engineering"</i></h2><br/>

[![GitHub - Project](https://img.shields.io/badge/GitHub-Project-2ea44f)](https://github.com/okarras/EmpiRE-Compass) [![Issues - Bug Report](https://img.shields.io/badge/Issues-Bug_Report-2ea44f)](https://github.com/okarras/EmpiRE-Compass/issues) [![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

</div>

> [!IMPORTANT]  
> Visit the live version of [EmpiRE-Compass](https://empire-compass.vercel.app/R186491/).

# Table of Contents

<details>
  <summary>Contents</summary>
  <ol>
    <li><a href="#about-the-project">About the Project</a></li>
    <li><a href="#key-features">Key Features</a></li>
    <li><a href="#folder-structure-and-files">Folder Structure and Files</a></li>
    <li><a href="#installation-instructions">Installation Instructions</a></li>
    <li><a href="#design-system--storybook">Design System & Storybook</a></li>
    <li><a href="#firebase-setup">Firebase Setup</a></li>
    <li><a href="#statistics-automation">Statistics Automation</a></li>
    <li><a href="#repository-links">Repository Links</a></li>
    <li><a href="#related-publications">Related Publications</a></li>
    <li><a href="#corresponding-author">Corresponding Author</a></li>
    <li><a href="#how-to-cite">How to Cite</a></li>
  </ol>
</details>

# About the Project

EmpiRE-Compass is a **neuro-symbolic dashboard** that facilitates the exploration, synthesis, and reuse of empirical research knowledge in Requirements Engineering (RE). It integrates two complementary layers: A symbolic layer based on the [Open Research Knowledge Graph (ORKG)](https://orkg.org) for structured, machine-actionable knowledge, and a neural layer leveraging large language models (LLMs) to answer both predefined and custom competency questions. This dual approach enables researchers to navigate the evolving knowledge landscape of empirical research in RE, identify reusable insights across publications, and promote Open Science through transparent, interoperable knowledge representations. EmpiRE-Compass currently focuses on two themes: Empirical research practices in RE using [KG-EmpiRE](https://www.oliver-karras.de/portfolio/kg-empire/), and empirical research practices in Natural Language Processing for RE using the [NLP4RE ID Card](https://zenodo.org/records/14197338).

<p align="right">(<a href="#top">back to top</a>)</p>

# Key Features

EmpiRE-Compass offers a rich set of capabilities to support exploration, synthesis, and reuse of empirical research in RE. Its exploratory visual analytics provide detailed insights into the state and evolution of the field through interactive charts and distributions. The platform’s neuro-symbolic synthesis combines structured knowledge graphs with neural large language models to answer competency questions, interpret findings, and support contextual knowledge integration. All structured data, SPARQL queries, analyses, and interpretations are openly available to foster replicable research and long-term reuse. EmpiRE-Compass is built on FAIR principles — ensuring that knowledge is findable, accessible, interoperable, and reusable — and is grounded in Open Science values of transparency, ethical attribution, and collaborative maintenance. Developed on top of the ORKG and supported by TIB, the platform is designed for community-driven contributions and long-term sustainability.

<p align="right">(<a href="#top">back to top</a>)</p>

# Folder Structure and Files

In the following, we first show a graphical overview of the folder structure and files of the project before we describe them in more detail.

## Graphical Overview

```
EmpiRE-Compass/
┣━ .github/
┃   ┗━ workflows/
┣━ .husky/
┣━ .storybook/
┃   ├── main.ts
┃   ├── preview.ts
┃   └── vitest.setup.ts
┣━ backend/                 # Backend API server
┣━ backups/                 # Firebase backups
┣━ dev-dist/                # Service worker files
┣━ docs/                    # Project documentation
┣━ public/                  # Public static assets
┣━ scripts/                 # Python statistics & maintenance scripts
┣━ src/
┃   ├── api/                # SPARQL query definitions
┃   ├── assets/             # Static image assets
┃   ├── auth/               # Authentication (Keycloak)
┃   ├── components/
┃   │   ├── Admin/          # Admin dashboard components
┃   │   ├── AI/             # AI Assistant & Chat components
┃   │   ├── CustomCharts/   # Visualization components
┃   │   ├── Home/           # Landing page components
┃   │   ├── Layout/         # Layout components
┃   │   └── ...             # Shared components
┃   ├── constants/          # Configuration constants
┃   ├── context/            # React Context Providers
┃   ├── firestore/          # Firebase CRUD services
┃   ├── helpers/            # Helper functions
┃   ├── hooks/              # Custom React hooks
┃   ├── pages/              # Route page components
┃   ├── prompts/            # AI Prompt templates
┃   ├── services/           # API services
┃   ├── store/              # Redux state management
┃   ├── stories/            # Storybook stories
┃   ├── styles/             # Global CSS
┃   ├── templates/          # JSON templates for domains
┃   ├── types/              # TypeScript definitions
┃   ├── utils/              # Utility functions
┃   ├── App.tsx             # Main App component
┃   ├── Router.tsx          # Routing configuration
┃   ├── firebase.ts         # Firebase initialization
┃   └── main.tsx            # Entry point
┣━ stories/                 # Storybook component stories
┣━ templates/               # Template definition files
┣━ .env                     # Environment variables
┣━ package.json             # Dependencies and scripts
┣━ README.md                # Project documentation
┣━ tsconfig.json            # TypeScript configuration
┗━ vite.config.ts           # Vite configuration
```

<p align="right">(<a href="#top">back to top</a>)</p>

## Description of the Folders and Files

| **Directory / File**                                         | **Description**                                         |
| ------------------------------------------------------------ | ------------------------------------------------------- |
| [.storybook/](.storybook/)                                   | Storybook configuration files.                          |
| [backend/](backend/)                                         | Node.js backend server for API handling.                |
| [scripts/](scripts/)                                         | Python scripts for data processing and statistics.      |
| [src/api/](src/api/)                                         | SPARQL query constants and definitions.                 |
| [src/auth/](src/auth/)                                       | Keycloak authentication logic and contexts.             |
| [src/components/](src/components/)                           | Reusable React components.                              |
| [src/components/Admin/](src/components/Admin/)               | Components for the administration dashboard.            |
| [src/components/AI/](src/components/AI/)                     | AI Assistant, Chat interface, and Logic.                |
| [src/components/CustomCharts/](src/components/CustomCharts/) | Custom visualization components using Recharts/MUI.     |
| [src/firestore/](src/firestore/)                             | Services for interacting with Firebase Firestore.       |
| [src/hooks/](src/hooks/)                                     | Custom React hooks (e.g., `useAIAssistant`, `useAuth`). |
| [src/pages/](src/pages/)                                     | Top-level page components corresponding to routes.      |
| [src/services/](src/services/)                               | API services for Backend and AI integration.            |
| [src/store/](src/store/)                                     | Redux store slices (`aiSlice`, `questionSlice`).        |
| [src/templates/](src/templates/)                             | JSON schemas defining research domain templates.        |
| [src/utils/](src/utils/)                                     | Utility functions for data formatting and processing.   |
| [package.json](package.json)                                 | Project dependencies and npm scripts.                   |
| [vite.config.ts](vite.config.ts)                             | Configuration for the Vite build tool.                  |

<p align="right">(<a href="#top">back to top</a>)</p>

# Installation Instructions

In the following, we explain how to install and run the project locally using a terminal, assuming that the prerequisites are met.

## 1. Ensure prerequisites are installed

- **Node.js** (version 18 or higher recommended)
- **Modern web browser** (e.g., Chrome, Firefox)
- **Git** (optional, for version control)

## 2. Clone the repository

```sh
git clone https://github.com/okarras/EmpiRE-Compass.git
```

## 3. Navigate to the main project directory

```sh
cd EmpiRE-Compass
```

## 4. Install dependencies

Using **npm**:

```sh
npm install
```

## 5. Configure environment variables

### Frontend Configuration

Copy the example environment file and configure your variables:

```sh
cp .env.example .env
```

Edit the `.env` file with your actual values. The `.env.example` file contains all necessary environment variables including:

- **Backend API URL**: `VITE_BACKEND_URL`
- **Keycloak Authentication** (optional): `VITE_KEYCLOAK_URL`, `VITE_KEYCLOAK_REALM`, `VITE_KEYCLOAK_CLIENT_ID`
- **Firebase Configuration**: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, etc.
- **AI Provider API Keys** (optional): `VITE_OPEN_AI_API_KEY`, `VITE_GROQ_API_KEY`, `VITE_MISTRAL_API_KEY`, `VITE_GOOGLE_GENERATIVE_AI_API_KEY`

**Note:**

- The application will work without Keycloak configuration, but authentication features (login/logout) and admin routes will not be available.
- AI API keys can also be configured directly in the UI. If you set them in `.env`, enable "Use Environment Keys" in the AI configuration settings.
- The dashboard and public features will function normally in unauthenticated mode.

### Backend Configuration (if running backend locally)

If you're running the backend server locally, configure backend environment variables:

```sh
cd backend
cp .env.example .env
```

Edit `backend/.env` with your backend configuration including:

- **Server Port**: `PORT`
- **AI Provider**: `AI_PROVIDER` (openai, groq, mistral, or google)
- **AI Models**: `OPENAI_MODEL`, `GROQ_MODEL`, `MISTRAL_MODEL`, `GOOGLE_MODEL`
- **AI API Keys**: `OPENAI_API_KEY`, `GROQ_API_KEY`, `MISTRAL_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`

## 6. Start the development server

Using **npm**:

```sh
npm run dev
```

## 7. Open the application in your browser

Visit:

```
http://localhost:5173
```

<p align="right">(<a href="#top">back to top</a>)</p>

# Design System & Storybook

EmpiRE-Compass includes a comprehensive design system documented in Storybook, providing a complete library of reusable UI components.

## 📚 **Storybook (Component Library)**

**Live Documentation**: [https://empire-compass-storybooks.vercel.app](https://empire-compass-storybooks.vercel.app)

## **Component Categories**

- **🏠 Home Components**: Hero sections, feature highlights, contact forms
- **📊 Data Visualization**: Custom charts, statistics cards, interactive graphs
- **🤖 AI Components**: AI assistant interface, chat messages, dynamic questions
- **🛡️ Admin Components**: Dashboard tools, settings, data management
- **🔧 Layout Components**: Headers, navigation, responsive containers
- **⚙️ Utility Components**: Loading states, error handling, form elements

## **Technology Stack**

- **React 18** with TypeScript
- **Material-UI (MUI)** component library
- **Storybook 7+** for documentation
- **Chromatic** for visual testing (planned)

## **Local Development**

```bash
# Start Storybook locally
npm run storybook

# Build Storybook for deployment
npm run build-storybook

# Preview built Storybook
npm run preview:storybook
```

<p align="right">(<a href="#top">back to top</a>)</p>

# Firebase Setup

EmpiRE-Compass uses Firebase for real-time statistics storage and automatic data updates. Follow these guides to set up Firebase integration:

## Quick Setup (5 minutes)

📋 **[Firebase Quick Setup Guide](docs/FIREBASE_QUICK_SETUP.md)** - Fast-track setup with essential steps

## Detailed Setup

📖 **[Complete Firebase Setup Guide](docs/GITHUB_FIREBASE_SETUP.md)** - Comprehensive guide with troubleshooting

## Firebase Configuration Steps:

1. **Create Firebase Project** - Set up a new project in Firebase Console
2. **Generate Service Account** - Download the service account JSON key
3. **Configure GitHub Secret** - Add `FIREBASE_SERVICE_ACCOUNT_KEY` to repository secrets
4. **Test Integration** - Run the workflow to verify everything works

## Local Development

```bash
# Validate your Firebase JSON file
cd scripts
python validate_firebase_json.py path/to/your/service-account.json

# Test Firebase integration
python firebase_integration.py

# Run statistics update locally
python empire-statistics.py --service_account path/to/service-account.json --limit 5
```

<p align="right">(<a href="#top">back to top</a>)</p>

# Statistics Automation

EmpiRE-Compass automatically updates statistics using GitHub Actions that run the `empire-statistics.py` script:

## Automated Updates

- **On every commit** to main branch
- **On merged pull requests**
- **Weekly schedule** (Mondays at 6 AM UTC)
- **Manual trigger** via GitHub Actions

## Statistics Collected

- **Paper count** - Total number of papers in KG-EmpiRE
- **Resources & Literals** - RDF resources and literal values
- **Predicates** - RDF predicates and properties
- **Distinct counts** - Unique resources, literals, and predicates
- **Averages** - Mean values per paper
- **Timestamps** - Last update and processing times

## Manual Execution

```bash
# Process all papers and update Firebase
python scripts/empire-statistics.py --service_account path/to/service-account.json

# Test with limited papers
python scripts/empire-statistics.py --limit 10 --service_account path/to/service-account.json

# Skip Firebase update (CSV only)
python scripts/empire-statistics.py --no_firebase
```

## Monitoring

- View execution logs in **GitHub Actions** tab
- Check results in **Firebase Console** → **Firestore Database**
- Download CSV reports from workflow artifacts

<p align="right">(<a href="#top">back to top</a>)</p>

# Repository Links

EmpiRE-Compass: [https://github.com/okarras/EmpiRE-Compass](https://github.com/okarras/EmpiRE-Compass)  
EmpiRE-Analysis: [https://github.com/okarras/EmpiRE-Analysis](https://github.com/okarras/EmpiRE-Analysis)  
Storybook (Design System): [https://empire-compass-storybooks.vercel.app/?path=/docs/layout-menudrawer--docs](https://empire-compass-storybooks.vercel.app/?path=/docs/layout-menudrawer--docs)

<p align="right">(<a href="#top">back to top</a>)</p>

# Related Publications

The first version of KG-EmpiRE based on **570 papers** from the [IEEE International Conference on Requirement Engineering](https://requirements-engineering.org/) from 2000 to 2022 and the first analysis of the sustainable literature review on the state and evolution of empirical research in RE have been published in:

> Oliver Karras, Felix Wernlein, Jil Klünder, and Sören Auer:<br/> >[**Divide and Conquer the EmpiRE: A Community-Maintainable Knowledge Graph of Empirical Research in Requirements Engineering**](https://doi.org/10.1109/ESEM56168.2023.10304795),
> In: 2023 ACM/IEEE International Symposium on Empirical Software Engineering and Measurement (ESEM), New Orleans, LA, USA, 2023, pp. 1-12.<br/>
>
> The publication received the [![Award - Best Paper](https://custom-icon-badges.demolab.com/badge/Award-Best_Paper-D4AF37?logo=trophy&logoColor=fff)](https://www.oliver-karras.de/wp-content/uploads/2023/10/acm_ieee_esem2023_certificate_best_paper_award.pdf) of the 17th ACM/IEEE International Symposium on Empirical Software Engineering and Measurement 2023.

The second version KG-EmpiRE based on **680 papers** from the [IEEE International Conference on Requirement Engineering](https://requirements-engineering.org/) from 1994 to 2022 and the analysis of the sustainable literature review on the state and evolution of empirical research in RE have been published in:

> Oliver Karras:<br/> >[**KG-EmpiRE: A Community-Maintainable Knowledge Graph for a Sustainable Literature Review on the State and Evolution of Empirical Research in Requirements Engineering**](https://doi.org/10.1109/RE59067.2024.00063),
> In: 2024 IEEE International Requirements Engineering Conference (RE), Reykjavík, Iceland, 2024.<br/>
>
> The artifact received the [![Badge - Available](https://custom-icon-badges.demolab.com/badge/Badge-Available-B4CEA0?logo=award&logoSource=feather)](https://conf.researchr.org/track/RE-2024/RE-2024-artifacts#Submission-Instructions), the [![Badge - Reusable](https://custom-icon-badges.demolab.com/badge/Badge-Reusable-F09D9F?logo=award&logoSource=feather)](https://conf.researchr.org/track/RE-2024/RE-2024-artifacts#Submission-Instructions), and [![Award - Best Artifact](https://custom-icon-badges.demolab.com/badge/Award-Best_Artifact-D4AF37?logo=trophy&logoColor=fff)](https://www.oliver-karras.de/wp-content/uploads/2024/06/IEEE_RE2024_Certifiacte_Best_Artifact_Award.pdf) from the [Artifact Evaluation track](https://conf.researchr.org/track/RE-2024/RE-2024-artifacts) of the [32nd IEEE International Requirements Engineering Conference 2024](https://conf.researchr.org/home/RE-2024).

<p align="right">(<a href="#top">back to top</a>)</p>

# Corresponding Author

[Dr. rer. nat. Oliver Karras](https://www.oliver-karras.de)

Researcher and Data Scientist - Open Research Knowledge Graph

TIB - Leibniz Information Centre for Science and Technology

Welfengarten 1B

30167 Hannover

E-Mail: [oliver.karras@tib.eu](mailto:oliver.karras@tib.eu)

<p align="right">(<a href="#top">back to top</a>)</p>

# How to Cite

If you want to cite this project, we suggest using the following reference:

> Oliver Karras, Amirreza Alasti, Sushant Aggarwal, Yücel Celik, and Lena John:<br/> [**EmpiRE-Compass**](https://empire-compass.vercel.app/R186491/), Computer Software, Version v1.4, https://github.com/okarras/EmpiRE-Compass, 2025.
>
> You can also use the "**Cite this repository**" function in the top right menu, resulting from the included [citation file format file](CITATION.cff) for human- and machine-readable citation information for software and datasets. Further information can be found on the [Citation File Format (CFF) website](https://citation-file-format.github.io/).

If you want to cite the related publications, use the references in the section <a href="#related-publications">related publications</a>.

<p align="right">(<a href="#top">back to top</a>)</p>

Released under [MIT](/LICENSE) by [Oliver Karras](https://github.com/OKarras).
