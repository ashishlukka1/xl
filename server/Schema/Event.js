const mongoose = require('mongoose');
const { Schema } = mongoose;

const EventSchema = new Schema(
  {
    client: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    event_type: {
      type: String,
      enum: ['usage_snapshot', 'support_ticket', 'meeting_note', 'crm_note'],
      required: true,
      index: true,
    },
    event_timestamp: {
      type: Date,
      required: true, // when the event actually happened, distinct from createdAt (when we ingested it)
    },
    // Flexible payload - shape depends on event_type. Kept as Mixed since
    // Mongoose schemas-within-schemas for 4 different shapes adds more
    // complexity than value here; the Signal Extraction Agent prompt
    // handles shape differences, not the DB layer.
    data: {
      type: Schema.Types.Mixed,
      required: true,
    },
    processed: {
      type: Boolean,
      default: false,
      index: true, // Planner queries { client, processed: false } every run
    },
    processed_in_run: {
      type: Schema.Types.ObjectId,
      ref: 'Run',
      default: null,
    },
  },
  { timestamps: true }
);

// Planner's core query: unprocessed events for a given client
EventSchema.index({ client: 1, processed: 1, event_timestamp: 1 });

module.exports = mongoose.model('Event', EventSchema);