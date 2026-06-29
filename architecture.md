# Architecture

## Overview

A decision-support application for Customer Success workflows. It turns raw customer events into evidence-backed recommendations that a human reviewer can approve, edit, or reject.

At a high level, the system has three major parts:

1. `client/`: a React + Vite single-page application for authentication, account browsing, event logging, run triggering, and recommendation review.
2. `server/`: an Express API that owns authentication, client data, run orchestration, recommendation decisions, and dashboard aggregation.
3. `MongoDB`: the system of record for users, clients, raw events, runs, claims, playbooks, recommendations, and memory outcomes.

The core product behavior is an NBA pipeline:

1. Raw customer events are stored.
2. A run is triggered for a client.
3. Claims are extracted from unprocessed events.
4. Deterministic playbooks are matched against those claims.
5. Recommendations are drafted and confidence-scored.
6. A human reviews the recommendation.
7. The review outcome is stored and reused to calibrate later recommendations.

## High-Level Architecture

![CSM User Event Processing](https://u.cubeupload.com/ashishl/CSMUserEventProcessi.png)

## Major Components

### Frontend

The frontend is a single React app with lightweight local state and custom hooks.

- `client/src/App.jsx`
  Controls top-level screen routing between `loading`, `landing`, `login`, and `dashboard`.
- `client/src/hooks/useAuth.js`
  Manages token lifecycle, login/register flow, session hydration, and logout.
- `client/src/hooks/useDashboard.js`
  Manages workspace state, selected account state, dashboard refresh, and user-triggered actions like create client, log event, run analysis, and recommendation decisions.
- `client/src/components/*`
  Encapsulate the sidebar, account detail views, recommendation cards, info panels, and modals.
- `client/src/api.js`
  Centralizes HTTP requests and consistent error handling.

The frontend is intentionally thin. It does not implement business rules locally; it renders server state and sends explicit user actions back to the backend.

### Backend API

The backend is an Express app with route modules organized by domain.

- `server/server.js`
  Bootstraps middleware, route mounting, database connection, and top-level error mapping.
- `server/routes/auth.js`
  Handles registration, login, and session rehydration.
- `server/routes/dashboard.js`
  Returns an aggregated workspace payload tailored for the signed-in user.
- `server/routes/clients.js`
  Owns client CRUD, event creation, client detail retrieval, and run triggering.
- `server/routes/recommendations.js`
  Owns human-in-the-loop decisions and memory outcome writes.
- `server/routes/playbooks.js`
  Exposes playbook definitions.
- `server/routes/runs.js`
  Exposes run-level audit detail.

### Run Orchestration

The business pipeline lives primarily in `server/utils/nbaEngine.js`.

This module is responsible for:

- discovering unprocessed events for a client
- creating a new `Run`
- extracting structured claims from events
- matching deterministic playbooks
- generating recommendations
- performing validator-round bookkeeping
- marking events as processed
- updating the client stage and latest run

This keeps the core workflow in one place instead of spreading it across route handlers.

### Persistence Layer

The backend uses Mongoose models under `server/Schema/`.

Core entities:

- `CsmUser`: authenticated workspace user
- `Client`: account owned by a CSM
- `Event`: raw customer signal
- `Run`: one execution of the recommendation pipeline
- `Claim`: structured evidence extracted from events
- `Playbook`: deterministic rule set for recommendation matching
- `Recommendation`: generated action proposal with evidence and review state
- `MemoryOutcome`: persisted human decision used for future confidence calibration

## End-to-End Data Flow

### 1. Authentication

1. The user logs in or registers through the React app.
2. The backend returns a JWT.
3. The frontend stores the token and sends it on future API calls.
4. `server/middleware/auth.js` validates the token and loads the user for protected routes.

### 2. Workspace Load

1. The frontend calls `/api/dashboard`.
2. The backend aggregates client, recommendation, and memory data via `getDashboardPayload`.
3. The frontend chooses a selected account and then loads detailed account data from `/api/clients/:clientId`.

### 3. Event Logging

1. A user logs a raw event from the UI.
2. The backend stores the event with `processed: false`.
3. That event becomes eligible for the next run.

### 4. Run Execution

1. The frontend calls `POST /api/clients/:clientId/runs`.
2. The backend creates a `Run`.
3. Unprocessed events are fetched in timestamp order.
4. Claims are extracted for each event.
5. Playbooks are matched against the extracted claims.
6. Recommendations are generated and ranked.
7. Events are marked processed and linked to the run.
8. The client record is updated with latest run, last processed timestamp, and inferred stage.

### 5. Human Review

1. The user approves, edits, or rejects a recommendation.
2. The backend updates recommendation status and decision metadata.
3. A `MemoryOutcome` record is upserted for that recommendation.
4. Future runs use recent memory outcomes to calibrate confidence scores.

## Key Design Decisions

### 1. Thin frontend, server-owned workflow

Decision:
Most business logic lives on the server, while the client focuses on rendering and user interaction.

Why:

- keeps workflow behavior consistent across all clients
- avoids duplicating rules in the browser
- makes auditability easier because the backend is the source of truth

Tradeoff:
The UI depends on richer API payloads and more round trips for refreshes.

### 2. Run-based processing instead of always-on streaming

Decision:
The system processes events in explicit runs rather than in a continuously streaming pipeline.

Why:

- each run becomes a traceable audit unit
- status changes like `extracting_claims`, `generating_recommendations`, and `awaiting_hitl` are easy to reason about
- demo and debugging workflows are simpler

Tradeoff:
Recommendations are not generated in real time; they appear when a run is triggered.

### 3. Hybrid AI + deterministic architecture

Decision:
LLMs are used for claim extraction and recommendation drafting, but playbook matching remains deterministic.

Why:

- AI is strongest at interpreting noisy raw events and drafting human-readable actions
- deterministic playbook matching keeps recommendation triggers explainable and auditable
- the system avoids using an LLM for the full decision path

Tradeoff:
The architecture is more complex than a pure rules engine or pure end-to-end LLM flow, but it gains better control and explainability.

### 4. Deterministic fallback when LLM is unavailable

Decision:
The pipeline can fall back to rules-based claim extraction and recommendation generation if Groq calls fail or are not configured.

Why:

- improves resilience for demos and local development
- avoids total workflow failure when an external AI dependency is unavailable
- preserves the main product loop even with degraded output quality

Tradeoff:
Fallback recommendations are less nuanced than LLM-generated ones.

### 5. Event-sourced raw input plus derived entities

Decision:
Raw events are stored separately from derived claims and recommendations.

Why:

- preserves the original signal for auditing
- allows reruns and re-interpretation of the same source data
- makes it possible to inspect the full evidence chain from recommendation back to raw input

Tradeoff:
The data model is more normalized and requires more joins/population for rich views.

### 6. Human-in-the-loop as a required step

Decision:
Recommendations are never considered final actions until a CSM reviews them.

Why:

- aligns the product with decision support rather than blind automation
- supports trust, accountability, and domain judgment
- allows edited recommendations to become learning signals

Tradeoff:
The product optimizes for reviewable guidance, not fully autonomous execution.

### 7. Confidence calibration from stored memory outcomes

Decision:
Past approve/edit/reject outcomes adjust future confidence scores for similar recommendation types on the same client.

Why:

- introduces a lightweight learning loop without retraining a model
- keeps the feedback mechanism explicit and inspectable
- rewards recommendation types that have historically landed well

Tradeoff:
This is heuristic calibration, not a statistically rigorous learning system.

### 8. Ownership-based access control

Decision:
Most routes verify that the current authenticated user owns the target client or recommendation.

Why:

- enforces basic tenant isolation inside the app
- keeps authorization logic close to the resource being accessed
- matches the product’s “each CSM owns a book of business” model

Tradeoff:
The current approach is simple and effective for single-owner accounts, but would need to evolve for team-based sharing or role hierarchies.

## Data Relationships

```text
CsmUser
  -> Client
      -> Event
      -> Run
          -> Claim
             -> source_event (Event)
          -> Recommendation
             -> evidence_claims (Claim[])
             -> matched_playbook (Playbook)
      -> MemoryOutcome
         -> recommendation (Recommendation)
```

## Operational Notes

- Authentication is JWT-based.
- The server is stateless apart from database persistence.
- The API is synchronous from the caller’s perspective; run execution happens inline in the request lifecycle.
- The dashboard endpoint returns an aggregated view optimized for the current UI rather than exposing only raw tables.
- MongoDB is used both for source entities and workflow artifacts, which keeps deployment simple for this stage of the product.
