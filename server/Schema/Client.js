const mongoose = require('mongoose');
const { Schema } = mongoose;

const ClientSchema = new Schema(
  {
    client_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    plan: {
      type: String,
      enum: ['Starter', 'Business', 'Enterprise'],
      required: true,
    },
    monthly_value: {
      type: Number,
      required: true,
      min: 0,
    },
    employee_count: {
      type: Number,
      min: 1,
    },
    contract_start_date: {
      type: Date,
      required: true,
    },
    renewal_date: {
      type: Date,
      required: true,
      index: true, // frequently sorted/filtered by renewal urgency
    },
    csm_owner: {
      type: Schema.Types.ObjectId,
      ref: 'CsmUser',
      required: true,
      index: true,
    },
    current_stage: {
      type: String,
      enum: ['onboarding', 'active_adoption', 'renewal_window', 'at_risk', 'expansion_ready', 'post_renewal'],
      default: 'onboarding',
    },
    last_processed_at: {
      type: Date,
      default: null, // null means never processed yet; Planner checks this
    },
    latest_run: {
      type: Schema.Types.ObjectId,
      ref: 'Run',
      default: null, // quick pointer to most recent run, avoids a sort query on dashboard load
    },
  },
  { timestamps: true } // createdAt / updatedAt auto-managed
);

module.exports = mongoose.model('Client', ClientSchema);