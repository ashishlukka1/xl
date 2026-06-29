const mongoose = require('mongoose');
const { Schema } = mongoose;

const ClaimSchema = new Schema(
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
    claim_code: {
      type: String, // short id like "C1", "C2" - used for human-readable evidence references in prompts/UI
      required: true,
    },
    type: {
      type: String,
      enum: ['risk', 'opportunity', 'neutral'],
      required: true,
    },
    tag: {
      type: String, // e.g. "usage_drop", "unresolved_ticket" - must match playbook condition tags exactly
      required: true,
      index: true, // Playbook Matching queries claims by tag
    },
    description: {
      type: String,
      required: true,
    },
    source_event: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true, // every claim must trace back to a raw event - this IS the evidence trail
    },
    source: {
      type: String,
      enum: ['groq', 'deterministic'],
      default: 'deterministic',
    },
  },
  { timestamps: true }
);

// Playbook Matching's core query: all claims for this client in this run, grouped by tag
ClaimSchema.index({ client: 1, run: 1, tag: 1 });

module.exports = mongoose.model('Claim', ClaimSchema);