const mongoose = require('mongoose');
const { Schema } = mongoose;

const MemoryOutcomeSchema = new Schema(
  {
    client: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    recommendation: {
      type: Schema.Types.ObjectId,
      ref: 'Recommendation',
      required: true, // traceability back to the exact recommendation this outcome came from
    },
    recommendation_type: {
      type: String,
      required: true,
      index: true,
    },
    confidence_at_decision: {
      type: Number,
      min: 0,
      max: 1,
      required: true,
    },
    decision: {
      type: String,
      enum: ['approved', 'edited', 'rejected'],
      required: true,
    },
  },
  { timestamps: true }
);

// Confidence Calibration's core query:
// all past outcomes for this client + this recommendation_type
MemoryOutcomeSchema.index({ client: 1, recommendation_type: 1 });

module.exports = mongoose.model('MemoryOutcome', MemoryOutcomeSchema);