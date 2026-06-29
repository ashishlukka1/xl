# Know What to Do Next, Every Time

An intelligent decision-support platform that turns raw customer signals into ranked, evidence-backed actions — built to show how any team managing ongoing client relationships can stop guessing and start acting with confidence.

---

## What it does

Managing client relationships means constantly juggling noisy data — usage drops, open tickets, negative meeting sentiment, stakeholder changes. Most teams either miss signals or react too late.

**For the purpose of this demonstration, we use a Customer Success Manager (CSM) at a B2B SaaS company as the example role.** The CSM manages a portfolio of enterprise clients and needs to know which accounts need attention, what action to take, and why.

Velocis ingests raw customer events, extracts structured evidence claims using an LLM, matches those claims against deterministic playbook rules, and drafts ranked recommendations for the CSM to approve, edit, or reject. Every decision is stored and used to calibrate confidence scores on future runs. The same pattern applies to any role that needs to act on incoming signals — sales, support, account management, or operations.

---

## Core Pipeline

```
Raw Events (usage, tickets, meetings, CRM)
        ↓
  Agent 1 — Signal Extraction (Groq llama-3.1-8b-instant)
        ↓ tagged claims
  Playbook Matching Engine (deterministic, no AI)
        ↓ matched rules
  Agent 2 — Recommendation Drafting (Groq llama-3.3-70b-versatile)
        ↓ ranked recommendations + adversarial validator
  HITL Review — CSM approves / edits / rejects
        ↓
  Memory Outcomes — feed confidence calibration on next run
```

---

## Features

| Feature | Description |
|---|---|
| **Planner Agent** | Checks for unprocessed events before starting a run; skips if nothing new |
| **Signal Extraction Agent** | LLM extracts typed, tagged claims from raw events; falls back to deterministic rules if Groq is unavailable |
| **Playbook Matching** | Condition-based rules match claims to guidance — fully auditable, no retrieval |
| **Recommendation Agent** | LLM drafts ranked, confidence-scored actions with explicit evidence references |
| **Adversarial Validator** | Self-checks recommendations for ignored or contradicted evidence; max 2 revision rounds |
| **HITL Approval** | CSM approves, edits, or rejects every recommendation before it's acted on |
| **Memory Outcomes** | Every decision is stored and adjusts confidence scores on future runs for the same client |
| **Run-based Processing** | Each processing cycle is a traceable unit (Run 1, Run 2, …) with full status history |

---

## How to use

1. Sign in with your CSM account (or register one)
2. Select a client from the sidebar — you'll see their KPIs, stage, and latest run status
3. Click **Log Event** to add a raw signal (usage snapshot, support ticket, meeting note, or CRM note)
4. Click **Trigger Planner Run** — the full pipeline runs:
   - Agent 1 extracts tagged, typed claims from each unprocessed event
   - Playbook engine deterministically matches claim tags to rules
   - Agent 2 drafts ranked recommendations with confidence scores and evidence references
   - Adversarial validator checks for ignored or contradicted evidence
5. Open the **Recommendations** tab and review each card
6. Approve the action as-is, edit the text and save, or reject it
7. Each decision writes to memory — on the next run, confidence scores for the same client and action type adjust based on your history
8. Use the **Events**, **Run History**, **Memory**, and **Playbooks** tabs to inspect the full audit trail

---

## Demo Account

A pre-seeded demo workspace is available with one client (Northstar Analytics) and a full event history showing healthy adoption → usage drop → support crisis → renewal risk.

```
Email:    ashishlukka2005@gmail.com
Password: ashish@12345
```

After logging in, select **Northstar Analytics** from the sidebar and trigger a planner run to see the full pipeline in action.

---

## Setup Details

### Prerequisites
- Node.js (LTS)
- MongoDB (local or Atlas)
- Groq API key — [console.groq.com](https://console.groq.com)

### 1. Clone and install

```bash
git clone <repo-url>
cd xl

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Configure environment

Create `server/.env`:

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/velocis-nba
JWT_SECRET=your-secure-secret
CLIENT_ORIGIN=http://localhost:5173
GROQ_API_KEY=your-groq-api-key
GROQ_SIGNAL_MODEL=llama-3.1-8b-instant
GROQ_RECOMMENDATION_MODEL=llama-3.3-70b-versatile
DEMO_CSM_EMAIL=you@example.com
DEMO_CLIENT_ID=NS-001
```

### 3. Seed demo data

```bash
cd server
npm run seed:demo
```

Creates 3 playbooks, 1 demo client (Northstar Analytics), and 6 events spanning the full customer lifecycle.

### 4. Run

```bash
# Terminal 1 — backend (port 3000)
cd server && npm run dev

# Terminal 2 — frontend (port 5173)
cd client && npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## API Routes

All routes except `/api/health` require a `Bearer <token>` header from login.

### Auth — `/api/auth`

#### `POST /api/auth/register`
Creates a new CSM account. Returns a JWT and the sanitized user object.

**Body**
```json
{ "name": "Avery Chen", "email": "avery@company.com", "password": "minimum8chars" }
```

**Response `201`**
```json
{ "token": "<jwt>", "user": { "id": "...", "name": "Avery Chen", "email": "avery@company.com" } }
```

---

#### `POST /api/auth/login`
Authenticates an existing CSM. Returns a JWT and user.

**Body**
```json
{ "email": "avery@company.com", "password": "minimum8chars" }
```

**Response `200`**
```json
{ "token": "<jwt>", "user": { "id": "...", "name": "Avery Chen", "email": "avery@company.com" } }
```

---

#### `GET /api/auth/me`
Returns the authenticated user from the token. Used on page refresh to restore session without re-login.

**Response `200`**
```json
{ "user": { "id": "...", "name": "Avery Chen", "email": "avery@company.com" } }
```

---

### Dashboard — `/api/dashboard`

#### `GET /api/dashboard`
Returns the full aggregated workspace payload for the authenticated CSM — all their clients with pending recommendation counts, latest run reference, memory signals, and portfolio-level stats.

**Response `200`**
```json
{
  "stats": {
    "totalAccounts": 3,
    "atRiskAccounts": 1,
    "expansionReadyAccounts": 1,
    "pendingRecommendations": 4,
    "approvedRecommendations": 2
  },
  "accounts": [
    {
      "id": "...",
      "clientId": "NS-001",
      "name": "Northstar Analytics",
      "plan": "Enterprise",
      "monthlyValue": 42000,
      "currentStage": "at_risk",
      "pendingRecommendationCount": 2,
      "latestRun": { "run_label": "Run 3", "status": "awaiting_hitl" }
    }
  ]
}
```

---

### Clients — `/api/clients`

#### `GET /api/clients`
Returns all clients owned by the authenticated CSM, sorted by renewal date.

---

#### `POST /api/clients`
Creates a new client and assigns it to the authenticated CSM.

**Body**
```json
{
  "client_id": "NS-002",
  "name": "Acme Corp",
  "plan": "Business",
  "monthly_value": 18000,
  "employee_count": 200,
  "contract_start_date": "2026-01-01",
  "renewal_date": "2026-12-31"
}
```

**Response `201`** — `{ "client": { ... } }`

---

#### `GET /api/clients/:clientId`
Returns the full detail payload for a single client — client record, last 10 runs, last 20 events, last 20 claims, last 20 recommendations with fully populated evidence chains, and last 20 memory outcomes.

**Response `200`**
```json
{
  "client": { ... },
  "runs": [ ... ],
  "events": [ ... ],
  "claims": [ ... ],
  "recommendations": [ ... ],
  "memoryOutcomes": [ ... ]
}
```

---

#### `POST /api/clients/:clientId/events`
Logs a raw customer event against a client. The event is marked `processed: false` and will be picked up by the next planner run.

**Body**
```json
{
  "event_type": "usage_snapshot",
  "event_timestamp": "2026-06-28T10:00:00.000Z",
  "data": { "usage_change_pct": -27, "adoption_score": 43, "active_seats": 388, "licensed_seats": 620 }
}
```

Supported `event_type` values: `usage_snapshot`, `support_ticket`, `meeting_note`, `crm_note`

**Response `201`** — `{ "event": { ... } }`

---

#### `GET /api/clients/:clientId/events`
Returns all events for a client sorted by timestamp descending.

---

#### `POST /api/clients/:clientId/runs`
Triggers the full NBA pipeline for a client. Internally:
1. Checks for unprocessed events — skips with `skipped: true` if none
2. Agent 1 extracts typed, tagged claims from each event (Groq, falls back to deterministic)
3. Playbook engine matches claim tags against active playbook conditions
4. Agent 2 drafts ranked recommendations with confidence scores and validator rounds (Groq, falls back to deterministic)
5. Marks all processed events, updates client stage, sets run to `awaiting_hitl`

**Body**
```json
{ "triggered_by": "manual" }
```

**Response `201`**
```json
{
  "run": { "run_label": "Run 2", "status": "awaiting_hitl" },
  "claims": [ ... ],
  "recommendations": [ ... ],
  "skipped": false
}
```

---

#### `GET /api/clients/:clientId/recommendations`
Returns all recommendations for a client with populated playbook and full evidence chain (claims → source events), sorted by creation date then rank.

---

### Recommendations — `/api/recommendations`

#### `PATCH /api/recommendations/:recommendationId/decision`
Records the CSM's HITL decision on a recommendation. Simultaneously writes a `MemoryOutcome` record that feeds confidence calibration on future runs for the same client and action type.

**Body**
```json
{ "decision": "approved", "edited_text": "" }
```

`decision` must be one of: `approved`, `edited`, `rejected`

When `decision` is `edited`, `edited_text` replaces the recommendation's action text.

**Response `200`** — the refreshed recommendation with all populated fields.

---

### Playbooks — `/api/playbooks`

#### `GET /api/playbooks`
Returns all playbooks sorted by creation date. Used by the frontend Playbook Library tab.

---

#### `POST /api/playbooks`
Creates a new playbook rule. Each condition needs a `tag`, `type`, and optional `min_count`.

**Body**
```json
{
  "playbook_code": "PB-04",
  "name": "Renewal Risk Motion",
  "conditions": [
    { "tag": "renewal_risk", "type": "risk", "min_count": 1 },
    { "tag": "stakeholder_change", "type": "risk", "min_count": 1 }
  ],
  "guidance": "Schedule an executive re-engagement call and prepare a tailored ROI summary before renewal",
  "recommended_action_type": "renewal_motion",
  "active": true
}
```

**Response `201`** — `{ "playbook": { ... } }`

---

### Runs — `/api/runs`

#### `GET /api/runs/:runId`
Returns the full detail of a single run — the run record, all claims extracted during it (with source events), and all recommendations generated (with playbooks and evidence chains).

**Response `200`**
```json
{
  "run": { "run_label": "Run 1", "status": "awaiting_hitl", "started_at": "...", "completed_at": "..." },
  "claims": [ { "claim_code": "C1", "type": "risk", "tag": "usage_drop", "description": "...", "source_event": { ... } } ],
  "recommendations": [ { "rec_code": "REC-...-1", "action": "...", "confidence": 0.82, "rank": 1 } ]
}
```

---

## Project Structure

```
xl/
├── client/                  # React 19 + Vite frontend
│   └── src/
│       ├── components/
│       │   ├── AccountDetail.jsx      # Tab layout: recs, events, runs, memory, playbooks
│       │   ├── AddClientModal.jsx     # Create client modal
│       │   ├── LogEventModal.jsx      # Log event modal
│       │   ├── RecommendationCard.jsx # HITL card with evidence chain
│       │   ├── InfoPanels.jsx         # RunHistory, EventFeed, MemoryOutcomes, PlaybookLibrary
│       │   └── Sidebar.jsx            # Account list + user footer
│       ├── hooks/
│       │   ├── useAuth.js             # Token, login, logout, session hydration
│       │   └── useDashboard.js        # Workspace state, account selection, actions
│       ├── api.js                     # Central apiRequest helper
│       ├── utils.js                   # formatDate, titleCase, confidenceLabel, stageLabel
│       └── App.jsx                    # Screen router: loading / landing / login / dashboard
│
└── server/                  # Node.js + Express backend
    ├── routes/
    │   ├── auth.js                # POST /register, POST /login, GET /me
    │   ├── clients.js             # CRUD + events + runs
    │   ├── recommendations.js     # PATCH /decision
    │   ├── dashboard.js           # GET aggregated workspace payload
    │   ├── playbooks.js           # GET + POST playbooks
    │   └── runs.js                # GET run detail
    ├── Schema/                    # Mongoose models
    │   ├── CsmUser.js
    │   ├── Client.js
    │   ├── Event.js
    │   ├── Run.js
    │   ├── Claim.js
    │   ├── Playbook.js
    │   ├── Recommendation.js
    │   └── Memoryoutcome.js
    ├── middleware/
    │   └── auth.js                # JWT verification
    ├── utils/
    │   ├── nbaEngine.js           # Full pipeline: extraction → matching → recommendations
    │   └── helpers.js             # sanitizeUser, signToken, buildApiError, getDashboardPayload
    ├── scripts/
    │   └── seedDemoWorkflow.js
    └── server.js                  # Entry point
```

---

## Data Schema Relationships

```
CsmUser
  └── Client (csm_owner)
        ├── Event (raw signals)
        ├── Run
        │     ├── Claim (source_event → Event)
        │     └── Recommendation
        │           ├── evidence_claims → Claim[]
        │           └── matched_playbook → Playbook
        └── MemoryOutcome (recommendation → Recommendation)
```

---

## Miscellaneous

This project was built for **XL Ventures**.
