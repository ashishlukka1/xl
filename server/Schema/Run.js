const mongoose = require('mongoose');
const { Schema } = mongoose;

const RunSchema = new Schema(
  {
    client: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    run_label: {
      type: String, // e.g. "Week 1", "Week 2" - human readable, used in demo UI dropdown
      required: true,
    },
    triggered_by: {
      type: String,
      enum: ['new_events', 'manual', 'scheduled'],
      default: 'new_events',
    },
    status: {
      type: String,
      enum: ['pending', 'extracting_claims', 'matching_playbooks', 'generating_recommendations', 'validating', 'awaiting_hitl', 'complete', 'skipped_no_change'],
      default: 'pending',
      index: true,
    },
    skipped_reason: {
      type: String, // filled only when status = 'skipped_no_change', e.g. "no new events since last run"
      default: null,
    },
    started_at: {
      type: Date,
      default: Date.now,
    },
    completed_at: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Most common query: "give me the latest run for this client"
RunSchema.index({ client: 1, createdAt: -1 });

module.exports = mongoose.model('Run', RunSchema);