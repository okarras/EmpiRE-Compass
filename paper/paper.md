---
title: 'EmpiRE-Compass: A neuro-symbolic dashboard for empirical requirements-engineering research practice'
tags:
  - TypeScript
  - React
  - requirements engineering
  - knowledge graph
  - empirical software engineering
  - Open Research Knowledge Graph
  - large language models
authors:
  - name: Oliver Karras
    orcid: 0000-0001-5336-6899
    corresponding: true
    affiliation: 1
  - name: Amirreza Alasti
    orcid: 0009-0002-1165-773X
    affiliation: 2
  - name: Lena John
    orcid: 0009-0007-2097-9761
    affiliation: 1
  - name: Sushant Aggarwal
    affiliation: 2
  - name: Yücel Celik
    affiliation: 2
affiliations:
  - index: 1
    name: TIB – Leibniz Information Centre for Science and Technology, Hannover, Germany
    ror: 04aj4at65
  - index: 2
    name: Leibniz University Hannover, Hannover, Germany
    ror: 0304hq317
date: 12 April 2026
bibliography: paper.bib
---

# Summary

Empirical research in requirements engineering (RE) is distributed across hundreds of publications, taxonomies, and reporting styles. **EmpiRE-Compass** is an open-source web application that helps researchers **explore**, **compare**, and **reuse** knowledge about empirical research practice in RE. It connects curated, structured evidence in the **Open Research Knowledge Graph (ORKG)** [@Jaradeh2021ORKG]—including the **KG-EmpiRE** knowledge graph [@Karras2023DivideConquer; @Karras2024KGEmpiRE]—with an optional **large language model (LLM)** layer for competency questions and synthesis. The tool is aimed at researchers, reviewers, and educators who work with empirical RE literature and need both machine-actionable structure and flexible natural-language access. A public deployment is available (see repository README), and the software is archived with a DOI [@EmpiRECompassZenodo].

![EmpiRE-Compass banner](../logo.png)

# Statement of need

Sustainable literature reviews and field-level analyses need more than PDFs and spreadsheets: they need **interoperable representations** of claims, methods, and evidence, aligned with **FAIR** principles [@Wilkinson2016FAIR]. KG-EmpiRE addresses this for empirical RE by encoding literature in a community-maintainable graph. However, graph-native exploration alone can be demanding for occasional users, and natural-language questions (for example about methods or metrics across papers) are not always easy to express in SPARQL alone.

EmpiRE-Compass targets this gap by providing a **dashboard** that (i) exposes KG-EmpiRE-related content through interactive visual analytics, (ii) supports structured querying and exploration aligned with ORKG, and (iii) optionally augments symbolic access with **LLM-assisted** answers grounded in the application context (user-configurable providers and keys). A second thematic focus is empirical practice in **NLP for RE**, supported via associated materials such as the NLP4RE ID Card dataset [@NLP4RE2024IDCard]. Together, these capabilities support reproducible overview, teaching, and cross-paper synthesis without replacing the underlying curated knowledge sources.

# State of the field

General tools for tabular literature reviews, reference managers, and ad hoc spreadsheets are widely used but typically lack **graph-level, community-curated semantics** tied to ORKG. ORKG-oriented interfaces and notebooks serve power users well, yet domain-specific **aggregated views** (distributions, comparisons, guided questions) for empirical RE practice remain scarce. EmpiRE-Compass is not a replacement for full ORKG authoring workflows or for standalone LLM chat interfaces; instead, it **specializes** the empirical-RE use case by coupling KG-EmpiRE (and related templates) with dashboard visualizations and optional LLM assistance. Building a separate application was justified by the need for a cohesive **requirements-engineering-specific** user experience, **operational deployment** constraints (authentication, content administration, statistics refresh), and **testable** backend–frontend boundaries suitable for review and maintenance.

# Software design

The system follows a **modular web architecture**: a **React** (TypeScript) front end and a **Node.js** backend with documented HTTP APIs (OpenAPI/Swagger in deployment). Structured access to the knowledge graph uses **SPARQL** and ORKG-aligned constants in the codebase; auxiliary services (for example **Firebase** for configuration and automated statistics, optional **Keycloak** for authentication) isolate operational concerns from core graph logic. **Continuous integration** includes workflows for statistics refresh and repository hygiene (for example secret scanning), and the repository ships **ESLint**, **Storybook** for documented UI components, and **Vitest** as a development dependency to grow automated tests—supporting reproducible review and maintenance. The LLM layer is **optional** and **provider-agnostic** at integration points so that deployments can restrict or omit generative features. **Storybook** documents UI components, supporting consistent visualization patterns across charts and admin views. This separation (symbolic data access vs. presentation vs. optional neural components) is intentional: it keeps the **research artifact** (graph-backed evidence) inspectable while still lowering the barrier to exploratory use.

# Research impact statement

EmpiRE-Compass builds directly on peer-reviewed work that introduced and extended **KG-EmpiRE** [@Karras2023DivideConquer; @Karras2024KGEmpiRE] and on the **ORKG** ecosystem [@Jaradeh2021ORKG]. The project is **publicly developed** on GitHub, ships with **automated statistics** updates and **continuous integration** workflows, and is **archived on Zenodo** with a DOI [@EmpiRECompassZenodo]. A **hosted instance** and **design-system documentation** (Storybook) are maintained to support external use and teaching; demonstration materials (including video DOI linked from the repository) further document real-world usage. These signals reflect adoption-oriented engineering rather than a one-off analysis script.

# AI usage disclosure

**Software:** EmpiRE-Compass optionally calls **third-party large language model APIs** configured by the deployer or end user (see application settings and environment configuration). Generative models are used for **interactive assistance** (for example competency-style questions); they do not replace the curated ORKG/KG-EmpiRE content, which remains the authoritative structured source.

**Manuscript:** The authors drafted and revised this paper. **Authors should update this sentence to match their actual practice**, for example: (a) _No generative AI was used to draft this manuscript_; or (b) _Generative AI tools [name/version] assisted with phrasing or structure; all authors reviewed, edited, and verified technical accuracy and citations._

# Acknowledgements

We thank colleagues and contributors who reported issues, suggested features, and helped maintain KG-EmpiRE and related ORKG content. Development has been supported through **TIB – Leibniz Information Centre for Science and Technology** and collaboration with **Leibniz University Hannover**. The sponsors had no editorial control over this submission.

**Conflicts of interest:** The authors declare no conflicts of interest relevant to this manuscript.

**Funding:** Institutional support as above; **authors should add grant numbers or formal funding statements if applicable.**

# References
