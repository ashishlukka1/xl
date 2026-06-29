const jwt = require('jsonwebtoken');
const { Client, MemoryOutcome, Recommendation } = require('../Schema');

const JWT_SECRET = process.env.JWT_SECRET;

function sanitizeUser(user) {
  return { id: user._id, name: user.name, email: user.email, createdAt: user.createdAt };
}

function signToken(user) {
  return jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
}

function buildApiError(error, fallbackStatus = 500) {
  return {
    statusCode: error.statusCode || fallbackStatus,
    message: error.message || 'Something went wrong.',
  };
}

async function loadRecommendationWithDetails(filter) {
  return Recommendation.findOne(filter)
    .populate('matched_playbook')
    .populate({ path: 'evidence_claims', populate: { path: 'source_event' } })
    .populate('client')
    .populate('run');
}

async function getDashboardPayload(userId) {
  const clients = await Client.find({ csm_owner: userId })
    .populate('latest_run')
    .sort({ renewal_date: 1, updatedAt: -1 });

  const clientIds = clients.map((c) => c._id);

  const [recommendations, memoryOutcomes] = await Promise.all([
    Recommendation.find({ client: { $in: clientIds } })
      .populate('matched_playbook')
      .sort({ createdAt: -1 }),
    MemoryOutcome.find({ client: { $in: clientIds } }).sort({ createdAt: -1 }),
  ]);

  const recMap = recommendations.reduce((acc, r) => {
    const key = String(r.client);
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  const memMap = memoryOutcomes.reduce((acc, o) => {
    const key = String(o.client);
    if (!acc[key]) acc[key] = [];
    acc[key].push(o);
    return acc;
  }, {});

  const accounts = clients.map((client) => {
    const clientRecs = recMap[String(client._id)] || [];
    const pending = clientRecs.filter((r) => r.status === 'pending');
    return {
      id: client._id,
      clientId: client.client_id,
      name: client.name,
      plan: client.plan,
      monthlyValue: client.monthly_value,
      employeeCount: client.employee_count,
      contractStartDate: client.contract_start_date,
      renewalDate: client.renewal_date,
      currentStage: client.current_stage,
      lastProcessedAt: client.last_processed_at,
      latestRun: client.latest_run,
      pendingRecommendationCount: pending.length,
      latestRecommendation: clientRecs[0] || null,
      memorySignal: (memMap[String(client._id)] || []).slice(0, 3),
    };
  });

  return {
    stats: {
      totalAccounts: accounts.length,
      atRiskAccounts: accounts.filter((a) => a.currentStage === 'at_risk').length,
      expansionReadyAccounts: accounts.filter((a) => a.currentStage === 'expansion_ready').length,
      pendingRecommendations: recommendations.filter((r) => r.status === 'pending').length,
      approvedRecommendations: recommendations.filter((r) => r.status === 'approved').length,
    },
    accounts,
  };
}

module.exports = { sanitizeUser, signToken, buildApiError, loadRecommendationWithDetails, getDashboardPayload };
