const express = require('express');
const { Client, Event, Run, Claim, Recommendation, MemoryOutcome } = require('../Schema');
const authMiddleware = require('../middleware/auth');
const { buildApiError } = require('../utils/helpers');
const { executeRunForClient } = require('../utils/nbaEngine');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const clients = await Client.find({ csm_owner: req.user._id })
      .populate('latest_run')
      .sort({ renewal_date: 1 });
    return res.json({ clients });
  } catch (error) {
    const e = buildApiError(error);
    return res.status(e.statusCode).json({ message: e.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const client = await Client.create({ ...req.body, csm_owner: req.user._id });
    return res.status(201).json({ client });
  } catch (error) {
    const e = buildApiError(error, 400);
    return res.status(e.statusCode).json({ message: e.message });
  }
});

router.get('/:clientId', authMiddleware, async (req, res) => {
  try {
    const client = await Client.findOne({
      _id: req.params.clientId,
      csm_owner: req.user._id,
    }).populate('latest_run');

    if (!client) return res.status(404).json({ message: 'Client not found.' });

    const [runs, events, claims, recommendations, memoryOutcomes] = await Promise.all([
      Run.find({ client: client._id }).sort({ createdAt: -1 }).limit(10),
      Event.find({ client: client._id }).sort({ event_timestamp: -1 }).limit(20),
      Claim.find({ client: client._id }).populate('source_event').sort({ createdAt: -1 }).limit(20),
      Recommendation.find({ client: client._id })
        .populate('matched_playbook')
        .populate({ path: 'evidence_claims', populate: { path: 'source_event' } })
        .sort({ createdAt: -1 })
        .limit(20),
      MemoryOutcome.find({ client: client._id }).sort({ createdAt: -1 }).limit(20),
    ]);

    return res.json({ client, runs, events, claims, recommendations, memoryOutcomes });
  } catch (error) {
    const e = buildApiError(error);
    return res.status(e.statusCode).json({ message: e.message });
  }
});

router.post('/:clientId/events', authMiddleware, async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.clientId, csm_owner: req.user._id });
    if (!client) return res.status(404).json({ message: 'Client not found.' });

    const event = await Event.create({
      client: client._id,
      event_type: req.body.event_type,
      event_timestamp: req.body.event_timestamp,
      data: req.body.data,
    });
    return res.status(201).json({ event });
  } catch (error) {
    const e = buildApiError(error, 400);
    return res.status(e.statusCode).json({ message: e.message });
  }
});

router.get('/:clientId/events', authMiddleware, async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.clientId, csm_owner: req.user._id });
    if (!client) return res.status(404).json({ message: 'Client not found.' });

    const events = await Event.find({ client: client._id }).sort({ event_timestamp: -1 });
    return res.json({ events });
  } catch (error) {
    const e = buildApiError(error);
    return res.status(e.statusCode).json({ message: e.message });
  }
});

router.post('/:clientId/runs', authMiddleware, async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.clientId, csm_owner: req.user._id });
    if (!client) return res.status(404).json({ message: 'Client not found.' });

    const result = await executeRunForClient(client._id, req.body.triggered_by || 'manual');
    const runDetails = await Run.findById(result.run._id);
    const recommendations = await Recommendation.find({ run: result.run._id })
      .populate('matched_playbook')
      .populate({ path: 'evidence_claims', populate: { path: 'source_event' } })
      .sort({ rank: 1 });

    return res.status(201).json({ run: runDetails, claims: result.claims, recommendations, skipped: result.skipped });
  } catch (error) {
    const e = buildApiError(error);
    return res.status(e.statusCode).json({ message: e.message });
  }
});

router.get('/:clientId/recommendations', authMiddleware, async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.clientId, csm_owner: req.user._id });
    if (!client) return res.status(404).json({ message: 'Client not found.' });

    const recommendations = await Recommendation.find({ client: client._id })
      .populate('matched_playbook')
      .populate({ path: 'evidence_claims', populate: { path: 'source_event' } })
      .sort({ createdAt: -1, rank: 1 });

    return res.json({ recommendations });
  } catch (error) {
    const e = buildApiError(error);
    return res.status(e.statusCode).json({ message: e.message });
  }
});

module.exports = router;
