const mongoose = require('mongoose');
const { Schema } = mongoose;

// Sub-schema for individual conditions within a playbook.
// Not its own collection since conditions never exist outside their parent playbook.
const ConditionSchema = new Schema(
  {
    tag: { type: String, required: true },
    type: { type: String, enum: ['risk', 'opportunity', 'neutral'], required: true },
    min_count: { type: Number, default: 1 }, // e.g. "unresolved_ticket" with min_count: 2
  },
  { _id: false }
);

const PlaybookSchema = new Schema(
  {
    playbook_code: {
      type: String, // e.g. "PB-04" - human-readable, referenced in recommendation citations
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    conditions: {
      type: [ConditionSchema],
      required: true,
      validate: (v) => Array.isArray(v) && v.length > 0,
    },
    guidance: {
      type: String,
      required: true,
    },
    recommended_action_type: {
      type: String,
      required: true,
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true, // matching engine only reads { active: true }
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Playbook', PlaybookSchema);