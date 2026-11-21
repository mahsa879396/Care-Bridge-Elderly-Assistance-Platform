import mongoose from 'mongoose';

// Define the shape (schema) of a help request stored in MongoDB.
const requestSchema = new mongoose.Schema(
  {
    // The senior who needs help, and who created the request.
    // Both are references ("links") to documents in the User collection.
    senior: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: {
      type: String,
      enum: ['grocery', 'mobility', 'companionship', 'other'],
      required: true,
    },
    description: { type: String, required: true, maxlength: 500 },
    language: { type: String, required: true },
    city: { type: String, required: true },
    // When the help is needed.
    date: { type: Date, required: true },
    // Where the request is in its life cycle.
    status: { type: String, enum: ['Pending', 'Accepted', 'Completed'], default: 'Pending' },
    // The volunteer who accepted the request (null until someone accepts).
    volunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    // Filled in later, when the senior rates the volunteer (1 to 5 stars).
    rating: { type: Number, min: 1, max: 5, default: null },
    review: { type: String, maxlength: 300 },
  },
  // timestamps adds createdAt and updatedAt automatically.
  { timestamps: true }
);

// Create the model from the schema and export it.
const Request = mongoose.model('Request', requestSchema);

export default Request;
