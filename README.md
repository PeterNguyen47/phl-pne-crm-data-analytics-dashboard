# PHL + PNE CRM & Passenger Insights Dashboard

Public-source CRM and passenger analytics prototype for Philadelphia International Airport (PHL) and Northeast Philadelphia Airport (PNE), mapped to the City of Philadelphia `Director of CRM and Data Analytics` capability framework.

This is an interview resource and dashboard prototype. It uses public PHL/PNE, City, FAA, and BTS references as evidence, labels non-public CRM and passenger-experience measures as illustrative models, and demonstrates how airport guest feedback, passenger journey signals, privacy controls, data governance, stakeholder adoption, and executive reports can be organized into a usable BI program.

Companion briefing deck: [PHL + PNE CRM Passenger Insights Executive Briefing](docs/briefing/phl-pne-crm-passenger-insights-executive-briefing.pptx)

## Prototype Screenshots

Screenshots are generated from the local Vite app after browser QA.

![CRM intelligence cockpit](docs/screenshots/prototype-v1-crm-cockpit-preview.webp)

![Passenger journey and feedback](docs/screenshots/prototype-v1-passenger-journey-preview.webp)

![CRM data strategy and governance](docs/screenshots/prototype-v1-crm-governance-preview.webp)

![Mobile CRM dashboard](docs/screenshots/prototype-v1-mobile-preview.webp)

## What This Demonstrates

- CRM and passenger insights dashboard design for PHL and PNE.
- Public-source research translated into executive CRM questions, evidence chains, and action lists.
- Passenger journey analytics across planning, arrival, accessibility support, terminal experience, disruption recovery, and PNE relationship touchpoints.
- Feedback-channel governance for surveys, complaints, compliments, digital touchpoints, accessibility contacts, and PNE service requests.
- Source-quality scoring with accountable owners, completeness, freshness, lineage, stewardship, privacy readiness, next controls, and escalation rules.
- Privacy and cybersecurity-aware CRM reporting, including PII minimization, role-based access, retention, lineage, and restricted accessibility workflows.
- PhilaUI-informed civic interface style with a restrained City-friendly executive dashboard layout.
- Client-side CSV, JSON, and Markdown downloads for cockpit, journey, program, governance, and evidence-chain reports.
- Workstream template upload so teams can preserve local CRM, survey, accessibility, or PNE templates while centralizing reporting metadata.
- Illustrative readiness prediction that updates after each template upload or refresh.
- Companion PowerPoint deck that explains the dashboard story for stakeholder or interview discussion.

## How This Maps To The Posting

The posting is used as the explicit capability framework, not as the product identity.

| Posting capability | Dashboard implementation |
| --- | --- |
| Lead CRM systems and guest experience data platforms | CRM Intelligence Cockpit, CRM feed blueprint, source quality, and decision worklist |
| Oversee surveys, complaint systems, service metrics, and digital touchpoints | Passenger Journey & Feedback view with channel health, journey touchpoints, and service themes |
| Capture the full customer journey across airport partners and internal systems | Journey evidence chain with public signals, internal data requests, and stakeholder owners |
| Develop dashboards and reports for senior leadership | Four-tab executive dashboard plus CSV, JSON, and Markdown exports |
| Analyze passenger behavior, service patterns, and operational trends | Service theme load, passenger journey heatmap, and operational context feed plan |
| Support Guest Experience, ADA/Accessibility, Operations, Marketing, IT, airlines, and tenants | Experience Programs & Stakeholders view with shared metrics and adoption needs |
| Establish governance, compliance, security, and responsible data use | CRM Data Strategy & Governance view with privacy controls and source-quality scoring |
| Build long-term CRM and analytics strategy | First 90 days roadmap and governed AI-assisted theme-detection boundary |

## How Public Data Becomes CRM BI

The dashboard uses this evidence chain:

`Posting requirement -> Public source fact -> Citation -> Passenger experience question -> Internal CRM data needed -> Dashboard artifact -> Decision or service improvement supported`

Example: PHL Fast Facts reports more than 30M 2025 passengers, 126 gates, seven terminal buildings, and 400 average daily departures. The dashboard converts that public scale into CRM questions about which journey stages generate repeat feedback, which channels have response SLA exposure, and where self-service or service recovery should be prioritized.

Accessibility is treated as a high-value, high-sensitivity analytics lane. PHL public accessibility content describes TSA Cares, AIRA, Hidden Disabilities Sunflower, visual paging, Access for All, and ADA/Title VI feedback routes. The dashboard converts those public programs into privacy-aware questions about support requests, alternative formats, handoff owners, resolution timing, and anonymized trends.

PNE is treated as a relationship-management portfolio rather than a terminal passenger journey. Public PNE context supports CRM questions about pilots, tenants, corporate aviation users, customs coordination, facility issues, and community touchpoints.

## Data Used

| Data category | Used for | Provenance |
| --- | --- | --- |
| City of Philadelphia CRM and Data Analytics posting | Capability framework for CRM, passenger analytics, feedback systems, dashboards, governance, privacy, and IT partnership | Public Source |
| PHL Fast Facts and About Us | Passenger scale, gates, terminals, parking, cargo, activity, PHL/PNE context, and public service positioning | Public Source |
| PNE public airport profile | Reliever-airport relationship lens, based-aircraft context, corporate aviation, customs services, and tenant/pilot audience | Public Source |
| PHL Accessibility and Title VI | Public accessibility programs, feedback routes, ADA/Title VI context, and high-sensitivity analytics needs | Public Source |
| FAA and BTS public datasets | Passenger activity and operational context for disruption and service recovery analysis | Public Source |
| CRM cases, survey scores, sentiment, response SLAs, feedback themes, adoption, and feed readiness | Realistic model of internal CRM/passenger data to request and govern | Illustrative Model |
| Passenger journey questions derived from public facts | Inference layer connecting public evidence to strategic action | Derived From Public |

Public source anchors:

- [City of Philadelphia CRM and Data Analytics posting](https://jobs.smartrecruiters.com/CityofPhiladelphia/744000131473969-director-of-crm-and-data-analytics)
- [PHL Fast Facts](https://www.phl.org/about/news/fast-facts)
- [PHL + PNE About Us](https://www.phl.org/about/about-us)
- [Northeast Philadelphia Airport](https://www.phl.org/PNE)
- [PHL Accessibility and Title VI](https://www.phl.org/at-phl/accessibility)
- [BTS On-Time Statistics](https://www.transtats.bts.gov/ONTIME/)
- [FAA Passenger and Cargo Data](https://www.faa.gov/airports/planning_capacity/passenger_allcargo_stats/passenger)
- [PhilaUI](https://ui.phila.gov/)

## Capability Map

- **CRM Intelligence Cockpit**: CRM KPIs, capability map, maturity path, evidence chains, source-quality scorecard, feed blueprint, and decision worklist.
- **Passenger Journey & Feedback**: feedback channels, journey touchpoints, service theme load, accessibility lane, PNE relationship touchpoints, and service recovery actions.
- **Experience Programs & Stakeholders**: Access for All, AIRA, Hidden Disabilities Sunflower, PNE relationship register, Guest Experience, ADA/Accessibility, Operations, Marketing/Digital, IT, and PNE Administration adoption needs.
- **CRM Data Strategy & Governance**: data asset drilldowns, feed connections, privacy/security controls, template upload, readiness prediction, source quality, and first 90 days roadmap.
- **Downloadable Reports**: client-side CSV, JSON, and Markdown exports for executive review.
- **Executive Briefing Deck**: editable PowerPoint narrative that turns the dashboard into a concise stakeholder story.

## Codebase Walkthrough

- `src/types/dashboard.ts`: shared TypeScript interfaces for CRM metrics, passenger journey, feedback channels, service themes, programs, stakeholders, feeds, source quality, privacy controls, insights, roadmap items, and decisions.
- `src/data/dashboardData.ts`: typed local fixtures, public source references, PHL/PNE profiles, CRM readiness models, feedback channels, journey touchpoints, source-quality scores, privacy controls, evidence chains, roadmap, and decisions.
- `src/App.tsx`: dashboard state, filter functions, report serializers, template upload parsing, readiness prediction, chart transforms, and four view compositions.
- `src/styles.css`: responsive City-friendly dashboard styling, service bar, report cards, provenance badges, status treatments, charts, roadmap, and mobile behavior.
- `docs/briefing/phl-pne-crm-passenger-insights-executive-briefing.pptx`: companion editable PowerPoint deck.

Inline comments are included where they clarify the provenance boundary, fixture modeling, filter behavior, derived metrics, and dashboard composition.

## Data Provenance

- `Public Source`: directly available public information such as the posting, PHL/PNE pages, accessibility content, FAA, and BTS.
- `Derived From Public`: analytical inference from public facts, such as translating passenger scale into journey-stage CRM questions.
- `Illustrative Model`: internal CRM or passenger-experience measures that are not publicly available, such as case counts, survey sentiment, response SLA, service recovery status, privacy readiness, and source quality.

## Run Locally

```bash
pnpm install
pnpm dev
```

Then open:

```text
http://127.0.0.1:5173
```

Production build:

```bash
pnpm build
```

## Prototype Status

This is prototype v1. It is not a production CRM system and does not connect to live airport, CRM, survey, accessibility, airline, tenant, operations, or digital analytics systems. All private operational metrics are illustrative until approved internal systems and governance controls are available.

## Changelog

### v1.0 - CRM and passenger insights interview resource

Added:

- New standalone Vite + React + TypeScript dashboard for the CRM and Data Analytics posting.
- Public-source PHL/PNE, accessibility, FAA, BTS, and posting evidence chain.
- Four role-aligned dashboard views.
- CRM feedback channels, journey touchpoints, service themes, guest programs, stakeholder adoption map, privacy controls, feed connections, source quality, and decision worklist.
- CSV, JSON, and Markdown report exports.
- Workstream template upload with illustrative readiness prediction.
- Companion editable PowerPoint briefing deck.

Known next steps:

- Replace illustrative CRM, survey, feedback, accessibility, digital, and PNE relationship data with approved internal feeds.
- Add authenticated source connectors and role-based access controls.
- Validate privacy/security controls with IT and Risk Management.
- Add automated tests beyond build and browser QA.
