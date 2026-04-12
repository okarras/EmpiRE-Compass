---
title: 'EmpiRE-Compass: A Neuro-Symbolic Dashboard for Sustainable and Dynamic Knowledge Exploration, Synthesis, and Reuse'
tags:
  - Neuro-symbolic dashboard
  - research knowledge graph
  - large language model
  - sustainable literature review
  - empirical software engineering
authors:
  - name: Amirreza Alasti
    orcid: 0009-0002-1165-773X
    corresponding: true
    affiliation: 2
  - name: Lena John
    orcid: 0009-0007-2097-9761
    affiliation: 1
  - name: Sushant Aggarwal
    affiliation: 2
  - name: Yücel Celik
    affiliation: 2
  - name: Oliver Karras
    orcid: 0000-0001-5336-6899
    affiliation: 1
affiliations:
  - index: 1
    name: TIB – Leibniz Information Centre for Science and Technology, Germany
    ror: 04aj4c181
  - index: 2
    name: Leibniz University Hannover, Germany
    ror: 0304hq317
date: 31 January 2026
bibliography: paper.bib
---

# Summary

**EmpiRE-Compass** is an open web application for exploring curated scholarly knowledge about empirical research in software and requirements engineering. It combines structured data in a **research knowledge graph** with optional **large language model** assistance so that users can ask questions, inspect the underlying queries, and view reproducible charts—without treating the model as a source of facts. The software is openly licensed, publicly deployed, and archived with a persistent identifier [@EmpiRECompassZenodo].

Software engineering (SE) and requirements engineering (RE) face a significant increase in secondary studies, particularly literature reviews (LRs), due to the ever-growing number of scientific publications [@Napoleao.2022; @Auer.2023; @Karras.2025; @Mendes.2020]. The rise of generative artificial intelligence (GenAI) has made ensuring the quality and transparency of LRs increasingly challenging. In general, data analyzed by GenAI systems are often not fully trustworthy or reliable due to issues such as hallucinations [@Schryen.2025].

[EmpiRE-Compass](https://empire-compass.tib.eu/) is a neuro-symbolic dashboard designed to lower barriers for accessing, replicating, and reusing LR data. By semantically structuring underlying data in research knowledge graphs (RKGs) and leveraging large language models (LLMs) for dynamic access, it enables sustainable knowledge exploration, synthesis, and reuse [@Karras.2025]. The tool builds upon FAIR data principles [@Wilkinson.2016; @Stocker.2022] and open scholarly knowledge graph practice [@Auer.2023] to make research data Findable, Accessible, Interoperable, and Reusable.

# Statement of Need

The core problem in modern LRs is the lack of availability of underlying data and artifacts [@Karras.2023]. This prevents collaboration and updating of LRs, as analyses and results cannot be replicated [@Karras.2025; @DosSantos.2024]. While open science practices are growing, only a minority of studies verifiably share their data and artifacts in persistent repositories [@Huotala.2025; @Wernlein.2022], often limited to static files rather than machine-actionable data [@Spadaro.2022; @Kaplan.2025]. Furthermore, effectively using Research Knowledge Graphs (RKGs) like the **[Open Research Knowledge Graph (ORKG)](https://orkg.org/)** requires advanced technical skills to query and interpret structured data.

**Target audience.** EmpiRE-Compass is intended for **researchers, educators, and reviewers** who run or rely on secondary studies (including systematic or living literature reviews) in empirical software engineering and requirements engineering, and who need **traceable** access to community-curated evidence without becoming SPARQL experts.

# State of the Field

Existing tools for scientific knowledge exploration and evidence synthesis generally fall into three categories, each with limitations that EmpiRE‑Compass addresses.

1. **Static and domain‑specific dashboards**. Scholarly knowledge‑graph dashboards, such as those built on ORKG for specific domains, demonstrate that KG‑powered visualizations can improve usability and engagement for targeted topics, but they typically expose a fixed set of charts and filters for a single template or dataset, rather than enabling users to formulate new questions or compose multi‑template syntheses across studies [@Auer.2023]. Similarly, “living” SLR dashboards in domains like biomedicine show the value of continuously updated, interactive evidence summaries, yet they are usually tightly coupled to bespoke pipelines and do not expose a reusable KG‑centric representation or user‑editable query logic [@Elbers.2021; @Manion.2024].
2. **Neuro‑symbolic scholarly assistants**. Recent neuro‑symbolic systems for scholarly search, including those that combine ORKG with large language models, focus primarily on answering natural language questions or ranking relevant contributions at the document level [@Oelen.2024]. While these approaches reduce hallucinations by grounding in a KG, they rarely provide transparent, user‑steerable analytics workflows: users cannot readily inspect or modify the underlying queries and data‑processing steps, and the outputs are typically textual answers rather than reproducible, shareable statistical visualizations over curated LR datasets [@Oelen.2024; @Brandon.2025].
3. **Generic LLM assistants and graph frontends**. General‑purpose LLM tools (e.g., conversational assistants) can summarize and compare individual papers but lack a symbolic ground truth and frequently hallucinate, making them unsuitable as a basis for rigorous secondary studies, especially when traceability and reproducibility are required [@Li.2025]. Conversely, generic KG frontends such as the ORKG comparison UI enable users to manually assemble comparisons and tables across papers, but constructing complex, multi‑paper syntheses demands substantial expertise in the underlying data model and query concepts and does not scale well as datasets and research questions grow [@Auer.2023].

**[EmpiRE-Compass](https://empire-compass.tib.eu/)** positions itself as a neuro‑symbolic orchestration layer on top of ORKG that bridges these gaps: it retains the KG as the single source of truth, like existing dashboards and neuro‑symbolic systems, but exposes the full pipeline from natural language question to SPARQL query to JavaScript data processing and visualization. This design enables non‑technical users to perform complex, multi‑paper analytics through natural language, while still allowing experts to inspect, edit, rerun, and share the exact queries and computations that underpin each “living” literature review.

# Software Design

**[EmpiRE-Compass](https://empire-compass.tib.eu/)** is a Progressive Web Application (PWA) built with a modular architecture. It separates the **Symbolic Layer** (the truth source) from the **Neural Layer** (the interface). The system is available online at [https://empire-compass.tib.eu](https://empire-compass.tib.eu/) and the source code is hosted on [GitHub](https://github.com/okarras/EmpiRE-Compass).

## Architecture & Design Trade-offs

We explain the main trade-offs, the design we chose, and why it matters for a research application that combines knowledge graphs with LLMs—balancing automation with correctness, privacy with convenience, and generality with domain fidelity.

**Symbolic vs. neural.** We treat the **symbolic layer** (ORKG, SPARQL, triplestore) as the **only source of factual data**. The LLM generates SPARQL and interprets only the _returned_ bindings; it never invents answers. That choice demands iterative refinement and editable code rather than a hidden pipeline. For literature review and empirical research practice, **grounding in the KG** is essential: conclusions must be traceable to the graph, and our design ensures every finding can be traced back to a SPARQL query and ORKG data.

**Human-in-the-loop.** We prioritize **accuracy and user control** over full automation. The system generates SPARQL, executes it against the live ORKG endpoint, and evaluates the outcome (syntax errors, empty results, all-null columns). On failure, it feeds structured feedback (including domain-specific hints) back into the LLM and retries up to **three times**, using the **database as the oracle**. Users can **edit the generated SPARQL** and the **data-processing code** (JavaScript) directly in the UI. Making the pipeline visible and editable supports **trust and reproducibility**: the same question can be re-run, shared, or adapted.

**Template-driven domain fidelity.** We use a **template registry** and **template-specific guidance** per ORKG template (e.g. R186491): domain knowledge, query patterns, and common mistakes are injected into prompts. This adds maintenance when adding templates but improves correctness and keeps the system **extensible**—new themes (e.g. NLP4RE) can be added without changing core logic—and aligns generated queries with how the community models each domain in the KG.

**Privacy and key management.** A **unified AI service** chooses at runtime: if the user supplies their own API keys, calls go **directly from the frontend** to the provider (OpenAI, Groq, Mistral, Google); if they use environment keys, calls go through our **Node.js backend**. We thus support both **privacy-first** use (sensitive questions never touch our servers) and **shared/demo** use without per-user key setup.

**Technology.** The frontend uses **React** and **Material-UI**; the backend uses **Node.js** and the **Vercel AI SDK** for model-agnostic LLM calls across providers. **Firestore** holds template metadata and community questions with real-time sync and Keycloak integration. These choices keep the symbolic layer (KG + SPARQL) as the definitive source of truth while supporting maintainability and community-driven use.

# Research Impact Statement

**[EmpiRE-Compass](https://empire-compass.tib.eu/)** is developed in direct connection to peer-reviewed work on **KG-EmpiRE** [@Karras.2023] and public ORKG infrastructure [@Auer.2023]. It has been applied to two curated research datasets that illustrate end-to-end use for the software engineering community:

1. **KG-EmpiRE**: interactive visualization and analytics over empirical RE literature encoded in the graph (776 papers in the deployment described in the repository documentation).
2. **NLP4RE ID Card**: dynamic access to 49 detailed “ID cards” for NLP-for-RE tools, aligned with replication-oriented discussion in the field [@Abualhaija.2024].

The software is **publicly hosted**, versioned, and **archived on Zenodo** with a DOI for citation and reproducibility [@EmpiRECompassZenodo], alongside a machine-readable **CITATION.cff** file in the repository. Together with Storybook-hosted UI documentation and open issue tracking, these artifacts provide concrete, checkable signals of community-oriented release practice beyond a one-off prototype.

By making these datasets interactive, the dashboard supports “living” literature reviews that can be updated as new contributions appear in the underlying knowledge graph, in line with calls for sustainable, evidence-based secondary research [@Mendes.2020; @Mendez.2020].

# AI Usage Disclosure

**Manuscript.** The authors used **Microsoft Copilot** and **Grammarly** for initial drafting, grammar refinement, and spelling checks of this manuscript. The core software design, architectural decisions, and the neuro-symbolic integration logic were conceived and implemented by the human authors. All AI-generated text was reviewed, edited, and validated by the authors to ensure accuracy and compliance with JOSS standards.

**Software.** EmpiRE-Compass integrates **third-party large language model APIs** as an optional runtime feature (user-configured providers and keys). During development, team members may have used **AI-assisted coding or refactoring tools**; all changes were reviewed, tested, and validated by the human authors, and the symbolic layer (ORKG/SPARQL) remains the source of factual answers.

# Acknowledgements

We thank the Open Research Knowledge Graph (ORKG) team for their infrastructure support.

# References
