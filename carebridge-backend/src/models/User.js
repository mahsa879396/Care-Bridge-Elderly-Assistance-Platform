import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Define the shape (schema) of a user document stored in MongoDB.
const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    // Email must be unique. It is stored lowercase and without extra spaces.
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    // The password is stored hashed (see the pre('save') hook below), never as plain text.
    password: { type: String, required: true },
    // Role decides what the user can do. Only these four values are allowed.
    role: { type: String, required: true, enum: ['senior', 'family', 'volunteer', 'admin'] },
    // A list of languages the user speaks; must contain at least one entry.
    languages: {
      type: [String],
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: 'At least one language is required',
      },
    },
    city: { type: String, required: true },
    // Only volunteers use this field; it tracks whether they were verified.
    verificationStatus: { type: String, enum: ['pending', 'verified', 'rejected'] },
  },
  // timestamps adds createdAt and updatedAt automatically.
  { timestamps: true }
);

// Before saving a user, hash the password with bcryptjs.
// This runs only when the password is new or was changed.
userSchema.pre('save', async function hashPassword(next) {
  // Volunteers start as "pending" until someone verifies them.
  if (this.role === 'volunteer' && !this.verificationStatus) {
    this.verificationStatus = 'pending';
  }

  // Skip hashing if the password was not changed.
  if (!this.isModified('password')) return next();

  // Generate a salt (random data) and hash the password with it.
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Helper used by login: compare a plain password with the stored hash.
userSchema.methods.comparePassword = function comparePassword(plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

// When a user is turned into JSON (e.g. for an API response), remove the password
// so it can never be sent back to the client by accident.
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

// Create the model from the schema and export it.
const User = mongoose.model('User', userSchema);

export default User;
