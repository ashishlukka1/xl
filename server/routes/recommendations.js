const express = require('express');
const { Client, MemoryOutcome } = require('../Schema');
const authMiddleware = require('../middleware/auth');
const { buildApiError, loadRecommendationWithDetails } = require('../utils/helpers');

const router = express.Router();

router.patch('/:recommendationId/decision', authMiddleware, async (req, res) => {
  try {
    const recommendation = await loadRecommendationWithDetails({ _id: req.params.recommendationId });
    if (!recommendation) return res.status(404).json({ message: 'Recommendation not found.' });

    const client = await Client.findOne({ _id: recommendation.client._id, csm_owner: req.user._id });
    if (!client) return res.status(403).json({ message: 'You do not have access to this recommendation.' });

    const { decision, edited_text } = req.body;
    if (!['approved', 'edited', 'rejected'].includes(decision))
      return res.status(400).json({ message: 'Decision must be approved, edited, or rejected.' });

    recommendation.status = decision;
    recommendation.hitl_decision = {
      decided_by: req.user._id,
      decision,
      edited_text: decision === 'edited' ? edited_text || recommendation.action : null,
      decided_at: new Date(),
    };
    if (decision === 'edited' && edited_text) recommendation.action = edited_text;
    await recommendation.save();

    await MemoryOutcome.findOneAndUpdate(
      { recommendation: recommendation._id },
      {
        client: recommendation.client._id,
        recommendation: recommendation._id,
        recommendation_type: recommendation.action_type,
        confidence_at_decision: recommendation.confidence,
        decision,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const refreshed = await loadRecommendationWithDetails({ _id: recommendation._id });
    return res.json({ recommendation: refreshed });
  } catch (error) {
    const e = buildApiError(error, 400);
    return res.status(e.statusCode).json({ message: e.message });
  }
});

module.exports = router;
