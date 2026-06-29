const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Schema } = mongoose;

const CsmUserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    // Note: client_ids are NOT stored here as an array.
    // Client.csm_owner is the source of truth (one-to-many from Client side).
    // To get "all clients for this CSM": Client.find({ csm_owner: csmUserId })
    // This avoids keeping two collections in sync when accounts are reassigned.
  },
  { timestamps: true }
);

CsmUserSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

CsmUserSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('CsmUser', CsmUserSchema);
