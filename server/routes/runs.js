const express = require('express');
const { Run, Claim, Recommendation, Client } = require('../Schema');
const authMiddleware = require('../middleware/auth');
const { buildApiError } = require('../utils/helpers');

const router = express.Router();

router.get('/:runId', authMiddleware, async (req, res) => {
  try {
    const run = await Run.findById(req.params.runId).populate('client');
    if (!run) return res.status(404).json({ message: 'Run not found.' });

    const client = await Client.findOne({ _id: run.client._id, csm_owner: req.user._id });
    if (!client) return res.status(403).json({ message: 'You do not have access to this run.' });

    const [claims, recommendations] = await Promise.all([
      Claim.find({ run: run._id }).populate('source_event').sort({ claim_code: 1 }),
      Recommendation.find({ run: run._id })
        .populate('matched_playbook')
        .populate({ path: 'evidence_claims', populate: { path: 'source_event' } })
        .sort({ rank: 1 }),
    ]);

    return res.json({ run, claims, recommendations });
  } catch (error) {
    const e = buildApiError(error);
    return res.status(e.statusCode).json({ message: e.message });
  }
});

module.exports = router;
