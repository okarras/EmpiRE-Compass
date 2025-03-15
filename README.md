<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/okarras/EmpiRE-Compass">
    <img src="logo.png" alt="Logo" width="500" height="250">
  </a>

<h2 align="center">EmpiRE-Compass<br/>
<i>"Navigating the EmpiRE of Empirical Research in Requirements Engineering"</i></h2>

---

# EmpiRE-Compass

EmpiRE-Compass is a comprehensive platform that facilitates the exploration, reproduction, and enrichment of empirical research data within the KG-EmpiRE ecosystem. By leveraging live data from the Open Research Knowledge Graph (ORKG), EmpiRE-Compass offers researchers a suite of tools for data visualization, comparative analysis, and structured data contributions—all while aligning with ACM standards.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
- [License](#license)
- [Repository Links](#repository-links)

---

## Overview

EmpiRE-Compass serves as a central hub for empirical research data management within KG-EmpiRE. It is designed to:

- Present 16 core competency questions alongside their answers and visual diagrams.
- Provide interactive diagrams that fetch live data from ORKG, including lists of relevant papers and direct links.
- Enable reproduction of published states of KG-EmpiRE and comparison with live data snapshots.
- Offer statistical insights (e.g., counts of conferences, papers, triples, resources, and literals).
- Support a structured survey for authors to submit empirical research data, including paper DOIs and related metadata.
- Serve as a study designer knowledge base to help users find similar empirical research studies and receive design recommendations.

---

## Key Features

- **Dashboard Display:**  
  Visualizes the 16 competency questions with corresponding answers and diagrams to provide an at-a-glance view of KG-EmpiRE data.

- **Interactive Diagrams:**  
  Dynamically pulls live data from ORKG, displaying interactive diagrams with clickable elements that lead to related research papers.

- **Reproduction & Comparison:**  
  Allows users to review historical published states of KG-EmpiRE and compare them with current live data.

- **Statistics & Metrics:**  
  Presents real-time statistics such as the number of conferences, papers, triples, resources, and literals in the KG-EmpiRE.

- **Data Contribution Workflow:**  
  Integrates a survey system that collects key empirical research data (including paper DOIs and curator-reviewed submissions) for incorporation into ORKG.

- **Study Designer Knowledge Base:**  
  Helps users identify similar empirical research and offers design recommendations based on the accumulated knowledge within KG-EmpiRE.

- **Deployment:**  
  Optimized for hosting on GitHub Pages, accompanied by comprehensive documentation for easy setup and use.

---

## Getting Started

### Prerequisites

Ensure you have the following installed before running EmpiRE-Compass locally or deploying it:

- **Node.js:** Required for running development scripts.
- **Modern Web Browser:** For accessing and testing the application.
- **Git (Optional):** For version control and repository management.

### Installation

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/okarras/EmpiRE-Compass.git
   cd EmpiRE-Compass
   ```

2. **Install Dependencies:**

   ```bash
   npm install
   ```

3. **Start the Development Server:**

   ```bash
   npm start
   ```

4. **Access the Application:**  
   Open your web browser and navigate to [http://localhost:3000](http://localhost:3000).

---

## Usage

- **Dashboard:**  
  View the 16 competency questions, along with their answers and visual diagrams that provide an overview of the KG-EmpiRE data.

- **Interactive Exploration:**  
  Interact with diagrams to access detailed empirical research insights, including related papers fetched in real time from ORKG.

- **Reproduction & Comparison:**  
  Use tools to load and compare different published states of KG-EmpiRE with current live data.

- **Data Contribution:**  
  Authors can use the integrated survey to submit empirical research details, which are then reviewed and incorporated into the ORKG database after curator approval.

- **Study Designer:**  
  Explore the knowledge base to identify similar studies and get tailored design recommendations based on ACM standards.

---

## License

EmpiRE-Compass is licensed under the [MIT License](LICENSE).

---

## Repository Links

- [EmpiRE-Compass Repository](https://github.com/okarras/EmpiRE-Compass)
- [EmpiRE-Analysis Repository](https://github.com/okarras/EmpiRE-Analysis)
