const mongoose = require('mongoose');
const { Schema } = mongoose;

// Embedded sub-schema: validator rounds always read/written together with
// their parent recommendation, and never queried independently - embed, don't reference.
const ValidatorRoundSchema = new Schema(
  {
    round: { type: Number, required: true },
    verdict: { type: String, enum: ['PASS', 'REVISE', 'NEEDS_MORE_DATA'], required: true },
    objection: { type: String, default: null },
  },
  { _id: false }
);

// Embedded sub-schema: the HITL decision is a 1:1 attribute of the recommendation,
// never queried on its own outside its parent - embed.
const HitlDecisionSchema = new Schema(
  {
    decided_by: { type: Schema.Types.ObjectId, ref: 'CsmUser', required: true },
    decision: { type: String, enum: ['approved', 'edited', 'rejected'], required: true },
    edited_text: { type: String, default: null },
    decided_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const RecommendationSchema = new Schema(
  {
    client: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    run: {
      type: Schema.Types.ObjectId,
      ref: 'Run',
      required: true,
      index: true,
    },
    rec_code: {
      type: String, // e.g. "REC-1001" - human readable reference
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    action_type: {
      type: String, // e.g. "escalate_technical", "expansion_proposal" - matches memory_outcomes.recommendation_type
      required: true,
      index: true,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      required: true,
    },
    rank: {
      type: Number,
      required: true, // 1 = top recommendation for this run
    },
    // References to Claim docs used as supporting evidence.
    // Referenced (not embedded) because claims are independently useful
    // (UI needs to show full claim detail + its source event on click).
    evidence_claims: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Claim',
      },
    ],
    matched_playbook: {
      type: Schema.Types.ObjectId,
      ref: 'Playbook',
      default: null, // null if no playbook fired - recommendation still valid, just unmatched
    },
    validator_history: {
      type: [ValidatorRoundSchema],
      default: [],
    },
    validator_unresolved: {
      type: Boolean,
      default: false, // true if still REVISE after the 2-round cap
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'edited', 'rejected'],
      default: 'pending',
      index: true,
    },
    hitl_decision: {
      type: HitlDecisionSchema,
      default: null,
    },
    source: {
      type: String,
      enum: ['groq', 'deterministic'],
      default: 'deterministic',
    },
  },
  { timestamps: true }
);

// Client detail page's core query: all recommendations for a run, ranked
RecommendationSchema.index({ client: 1, run: 1, rank: 1 });

module.exports = mongoose.model('Recommendation', RecommendationSchema);