# Paste-Ready Mongo Objects

Use these objects directly in MongoDB Compass or `mongosh`. This avoids hardcoding demo data in application code.

## 1. Existing CSM user

You already have this `CsmUser`. Copy its `_id` from MongoDB and reuse it as `csm_owner` in the client document below.

Example variable:

- `CSM_USER_ID = ObjectId("PASTE_ASHISH_USER_ID_HERE")`

## 2. Playbook collection

Collection: `playbooks`

```javascript
[
  {
    playbook_code: "PB-01",
    name: "Adoption Rescue Motion",
    conditions: [
      { tag: "usage_drop", type: "risk", min_count: 1 },
      { tag: "low_adoption", type: "risk", min_count: 1 }
    ],
    guidance: "Schedule an executive-level adoption recovery call, diagnose workflow blockers, and propose a 14-day success plan",
    recommended_action_type: "adoption_recovery",
    active: true,
    createdAt: new Date("2026-06-28T18:00:00.000Z"),
    updatedAt: new Date("2026-06-28T18:00:00.000Z")
  },
  {
    playbook_code: "PB-02",
    name: "Support Escalation Motion",
    conditions: [
      { tag: "critical_support_issue", type: "risk", min_count: 1 },
      { tag: "unresolved_ticket", type: "risk", min_count: 1 }
    ],
    guidance: "Escalate the account internally, attach support evidence, and send the customer a recovery timeline with named owners",
    recommended_action_type: "support_escalation",
    active: true,
    createdAt: new Date("2026-06-28T18:01:00.000Z"),
    updatedAt: new Date("2026-06-28T18:01:00.000Z")
  },
  {
    playbook_code: "PB-03",
    name: "Expansion Qualification Motion",
    conditions: [
      { tag: "strong_adoption", type: "opportunity", min_count: 1 },
      { tag: "expansion_interest", type: "opportunity", min_count: 1 }
    ],
    guidance: "Coordinate an expansion discovery meeting with the champion and map additional team rollout opportunities",
    recommended_action_type: "expansion_motion",
    active: true,
    createdAt: new Date("2026-06-28T18:02:00.000Z"),
    updatedAt: new Date("2026-06-28T18:02:00.000Z")
  }
]
```

## 3. Client collection

Collection: `clients`

```javascript
{
  client_id: "NS-001",
  name: "Northstar Analytics",
  plan: "Enterprise",
  monthly_value: 42000,
  employee_count: 860,
  contract_start_date: new Date("2026-01-15T00:00:00.000Z"),
  renewal_date: new Date("2026-09-30T00:00:00.000Z"),
  csm_owner: ObjectId("PASTE_ASHISH_USER_ID_HERE"),
  current_stage: "active_adoption",
  last_processed_at: null,
  latest_run: null,
  createdAt: new Date("2026-06-28T18:10:00.000Z"),
  updatedAt: new Date("2026-06-28T18:10:00.000Z")
}
```

After inserting this, copy the created `_id` and reuse it as `client` in the events below.

Example variable:

- `CLIENT_OBJECT_ID = ObjectId("PASTE_CLIENT_ID_HERE")`

## 4. Event collection

Collection: `events`

Insert these first. `Run`, `Claim`, `Recommendation`, and `MemoryOutcome` should be generated progressively after you call:

```http
POST /api/clients/:clientId/runs
```

```javascript
[
  {
    client: ObjectId("PASTE_CLIENT_ID_HERE"),
    event_type: "usage_snapshot",
    event_timestamp: new Date("2026-04-18T10:00:00.000Z"),
    data: {
      usage_change_pct: 28,
      adoption_score: 84,
      active_seats: 540,
      licensed_seats: 620
    },
    processed: false,
    processed_in_run: null,
    createdAt: new Date("2026-04-18T10:05:00.000Z"),
    updatedAt: new Date("2026-04-18T10:05:00.000Z")
  },
  {
    client: ObjectId("PASTE_CLIENT_ID_HERE"),
    event_type: "meeting_note",
    event_timestamp: new Date("2026-04-22T16:30:00.000Z"),
    data: {
      sentiment: "positive",
      expansion_interest: true,
      note: "Champion wants to expand to the RevOps team if onboarding capacity and reporting templates are ready."
    },
    processed: false,
    processed_in_run: null,
    createdAt: new Date("2026-04-22T16:35:00.000Z"),
    updatedAt: new Date("2026-04-22T16:35:00.000Z")
  },
  {
    client: ObjectId("PASTE_CLIENT_ID_HERE"),
    event_type: "usage_snapshot",
    event_timestamp: new Date("2026-06-26T09:00:00.000Z"),
    data: {
      usage_change_pct: -27,
      adoption_score: 43,
      active_seats: 388,
      licensed_seats: 620
    },
    processed: false,
    processed_in_run: null,
    createdAt: new Date("2026-06-26T09:05:00.000Z"),
    updatedAt: new Date("2026-06-26T09:05:00.000Z")
  },
  {
    client: ObjectId("PASTE_CLIENT_ID_HERE"),
    event_type: "support_ticket",
    event_timestamp: new Date("2026-06-26T13:40:00.000Z"),
    data: {
      priority: "high",
      status: "open",
      csat: 2,
      summary: "Automated export jobs are failing for finance stakeholders."
    },
    processed: false,
    processed_in_run: null,
    createdAt: new Date("2026-06-26T13:45:00.000Z"),
    updatedAt: new Date("2026-06-26T13:45:00.000Z")
  },
  {
    client: ObjectId("PASTE_CLIENT_ID_HERE"),
    event_type: "meeting_note",
    event_timestamp: new Date("2026-06-27T11:15:00.000Z"),
    data: {
      sentiment: "negative",
      renewal_risk: true,
      note: "CFO is questioning ROI after failed exports and lower usage from two business units."
    },
    processed: false,
    processed_in_run: null,
    createdAt: new Date("2026-06-27T11:20:00.000Z"),
    updatedAt: new Date("2026-06-27T11:20:00.000Z")
  },
  {
    client: ObjectId("PASTE_CLIENT_ID_HERE"),
    event_type: "crm_note",
    event_timestamp: new Date("2026-06-27T18:10:00.000Z"),
    data: {
      executive_sponsor_change: true,
      champion_change: false,
      expansion_window: false,
      note: "New VP Ops joined and has not yet adopted the current analytics workflow."
    },
    processed: false,
    processed_in_run: null,
    createdAt: new Date("2026-06-27T18:15:00.000Z"),
    updatedAt: new Date("2026-06-27T18:15:00.000Z")
  }
]
```

## 5. Optional historical memory outcome

Only insert this after you already have a historical `recommendation` document and know its `_id`.

Collection: `memoryoutcomes`

```javascript
{
  client: ObjectId("PASTE_CLIENT_ID_HERE"),
  recommendation: ObjectId("PASTE_RECOMMENDATION_ID_HERE"),
  recommendation_type: "expansion_motion",
  confidence_at_decision: 0.86,
  decision: "approved",
  createdAt: new Date("2026-04-23T10:00:00.000Z"),
  updatedAt: new Date("2026-04-23T10:00:00.000Z")
}
```

## Recommended progressive flow

1. Insert the `playbooks`.
2. Insert the `client`.
3. Insert the `events`.
4. Log in as Ashish.
5. Trigger:

```http
POST /api/clients/:clientId/runs
```

6. Let the system create:
   - `runs`
   - `claims`
   - `recommendations`
7. Approve or reject recommendations in the dashboard.
8. Let the app write `memoryoutcomes`.
