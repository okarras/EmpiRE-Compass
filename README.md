<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/okarras/EmpiRE-Compass">
    <img src="logo.png" alt="Logo" width="500" height="250">
  </a>
</div>
<h2 align="center">EmpiRE-Compass<br/>
<i>"Navigating the EmpiRE of Empirical Research in Requirements Engineering"</i></h2>

<!-- <p>
  <img src="https://user-images.githubusercontent.com/PLACEHOLDER/logo.png" alt="EmpiRE-Compass Logo" width="300" />
</p> -->

"Navigating the EmpiRE of Empirical Research in Requirements Engineering"

EmpiRE-Compass is a comprehensive platform that facilitates the exploration, reproduction, and enrichment of empirical research data within the KG-EmpiRE ecosystem. By leveraging live data from the Open Research Knowledge Graph (ORKG), EmpiRE-Compass offers researchers a suite of tools for data visualization, comparative analysis, and structured data contribution—all while aligning with ACM standards.

---

## Table of Contents

1. [Overview](#overview)  
2. [Key Features](#key-features)  
3. [Getting Started](#getting-started)  
   1. [Prerequisites](#prerequisites)  
   2. [Installation](#installation)  
4. [Usage](#usage)  
5. [License](#license)  
6. [Repository Links](#repository-links)

---

## Overview

EmpiRE-Compass serves as a central hub for empirical research data management. It provides interactive diagrams connected to live ORKG data, offers reproducibility and comparison of different KG-EmpiRE states, displays statistics on conferences and papers, and includes a survey-based data contribution workflow for new research submissions. A Study Designer Knowledge Base helps users find similar research and receive design recommendations aligned with ACM standards.

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

## License

This project is licensed under the [MIT License](LICENSE).

---

## Repository Links

EmpiRE-Compass: [https://github.com/okarras/EmpiRE-Compass](https://github.com/okarras/EmpiRE-Compass)  
EmpiRE-Analysis: [https://github.com/okarras/EmpiRE-Analysis](https://github.com/okarras/EmpiRE-Analysis)
