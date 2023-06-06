module.exports = {
  did: { type: String, required: true },
  operation: { type: String },
  timestamp: { type: Number },
  topic: { type: String },
  payload: { type: {} }, // {}, Object, Schema.Types.Mixed are equivalent
};
