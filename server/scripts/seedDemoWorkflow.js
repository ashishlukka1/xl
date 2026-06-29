require('dotenv').config();

const mongoose = require('mongoose');
const { Client, CsmUser, Event, Playbook } = require('../Schema');

const MONGODB_URI = process.env.MONGODB_URI;
const CSM_EMAIL = process.env.DEMO_CSM_EMAIL;
const DEMO_CLIENT_ID = process.env.DEMO_CLIENT_ID || 'NS-001';

const demoClient = {
  client_id: DEMO_CLIENT_ID,
  name: 'Northstar Analytics',
  plan: 'Enterprise',
  monthly_value: 42000,
  employee_count: 860,
  contract_start_date: new Date('2026-01-15T00:00:00.000Z'),
  renewal_date: new Date('2026-09-30T00:00:00.000Z'),
  current_stage: 'active_adoption',
  last_processed_at: null,
  latest_run: null,
};

const playbooks = [
  {
    playbook_code: 'PB-01',
    name: 'Adoption Rescue Motion',
    conditions: [
      { tag: 'usage_drop', type: 'risk', min_count: 1 },
      { tag: 'low_adoption', type: 'risk', min_count: 1 },
    ],
    guidance:
      'Schedule an executive-level adoption recovery call, diagnose workflow blockers, and propose a 14-day success plan',
    recommended_action_type: 'adoption_recovery',
    active: true,
  },
  {
    playbook_code: 'PB-02',
    name: 'Support Escalation Motion',
    conditions: [
      { tag: 'critical_support_issue', type: 'risk', min_count: 1 },
      { tag: 'unresolved_ticket', type: 'risk', min_count: 1 },
    ],
    guidance:
      'Escalate the account internally, attach support evidence, and send the customer a recovery timeline with named owners',
    recommended_action_type: 'support_escalation',
    active: true,
  },
  {
    playbook_code: 'PB-03',
    name: 'Expansion Qualification Motion',
    conditions: [
      { tag: 'strong_adoption', type: 'opportunity', min_count: 1 },
      { tag: 'expansion_interest', type: 'opportunity', min_count: 1 },
    ],
    guidance:
      'Coordinate an expansion discovery meeting with the champion and map additional team rollout opportunities',
    recommended_action_type: 'expansion_motion',
    active: true,
  },
];

const demoEvents = [
  {
    event_type: 'usage_snapshot',
    event_timestamp: new Date('2026-04-18T10:00:00.000Z'),
    data: {
      usage_change_pct: 28,
      adoption_score: 84,
      active_seats: 540,
      licensed_seats: 620,
    },
  },
  {
    event_type: 'meeting_note',
    event_timestamp: new Date('2026-04-22T16:30:00.000Z'),
    data: {
      sentiment: 'positive',
      expansion_interest: true,
      note:
        'Champion wants to expand to the RevOps team if onboarding capacity and reporting templates are ready.',
    },
  },
  {
    event_type: 'usage_snapshot',
    event_timestamp: new Date('2026-06-26T09:00:00.000Z'),
    data: {
      usage_change_pct: -27,
      adoption_score: 43,
      active_seats: 388,
      licensed_seats: 620,
    },
  },
  {
    event_type: 'support_ticket',
    event_timestamp: new Date('2026-06-26T13:40:00.000Z'),
    data: {
      priority: 'high',
      status: 'open',
      csat: 2,
      summary: 'Automated export jobs are failing for finance stakeholders.',
    },
  },
  {
    event_type: 'meeting_note',
    event_timestamp: new Date('2026-06-27T11:15:00.000Z'),
    data: {
      sentiment: 'negative',
      renewal_risk: true,
      note:
        'CFO is questioning ROI after failed exports and lower usage from two business units.',
    },
  },
  {
    event_type: 'crm_note',
    event_timestamp: new Date('2026-06-27T18:10:00.000Z'),
    data: {
      executive_sponsor_change: true,
      champion_change: false,
      expansion_window: false,
      note: 'New VP Ops joined and has not yet adopted the current analytics workflow.',
    },
  },
];

async function ensurePlaybooks() {
  for (const playbook of playbooks) {
    await Playbook.findOneAndUpdate(
      { playbook_code: playbook.playbook_code },
      playbook,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
}

async function ensureClient(csm) {
  return Client.findOneAndUpdate(
    { client_id: DEMO_CLIENT_ID },
    {
      ...demoClient,
      csm_owner: csm._id,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function ensureEvents(client) {
  let inserted = 0;

  for (const event of demoEvents) {
    const exists = await Event.findOne({
      client: client._id,
      event_type: event.event_type,
      event_timestamp: event.event_timestamp,
    });

    if (!exists) {
      await Event.create({
        client: client._id,
        ...event,
        processed: false,
        processed_in_run: null,
      });
      inserted += 1;
    }
  }

  return inserted;
}

async function main() {
  if (!MONGODB_URI) {
    throw new Error('Missing MONGODB_URI in .env');
  }

  if (!CSM_EMAIL) {
    throw new Error('Missing DEMO_CSM_EMAIL in .env');
  }

  await mongoose.connect(MONGODB_URI);

  const csm = await CsmUser.findOne({ email: CSM_EMAIL });
  if (!csm) {
    throw new Error(`CSM user ${CSM_EMAIL} was not found. Create or import that user first.`);
  }

  await ensurePlaybooks();
  const client = await ensureClient(csm);
  const insertedEventCount = await ensureEvents(client);

  const eventCount = await Event.countDocuments({ client: client._id });
  const playbookCount = await Playbook.countDocuments({ active: true });

  console.log('Demo seed complete.');
  console.log(
    JSON.stringify(
      {
        csm: {
          id: csm._id,
          email: csm.email,
        },
        client: {
          id: client._id,
          client_id: client.client_id,
          name: client.name,
          plan: client.plan,
          current_stage: client.current_stage,
        },
        playbooks: {
          active: playbookCount,
        },
        events: {
          insertedNow: insertedEventCount,
          totalForClient: eventCount,
        },
        nextStep: `POST /api/clients/${client._id}/runs`,
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
