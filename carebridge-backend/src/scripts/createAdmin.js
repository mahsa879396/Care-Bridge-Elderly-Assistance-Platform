// Load variables from .env (needed for the ADMIN_* values and MONGODB_URI).
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';

// Print a clear error and stop the script.
const fail = (message) => {
  console.error(`❌ ${message}`);
  process.exit(1);
};

// Creates one admin user based on the ADMIN_* values in .env.
const createAdmin = async () => {
  // 1. Read the admin details from .env.
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const firstName = process.env.ADMIN_FIRST_NAME;
  const lastName = process.env.ADMIN_LAST_NAME;

  // All four values are required.
  if (!email || !password || !firstName || !lastName) {
    fail('Missing ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FIRST_NAME or ADMIN_LAST_NAME in .env');
  }

  // 2. Connect to MongoDB.
  await connectDB();

  // 3. If a user with this email already exists, do nothing.
  const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (existingUser) {
    console.log(`ℹ️  A user with email ${email} already exists. Nothing to do.`);
  } else {
    // 4. Create the admin. The model hashes the password before saving.
    await User.create({
      firstName,
      lastName,
      email: email.toLowerCase().trim(),
      phone: '-',
      password,
      role: 'admin',
      languages: ['English'],
      city: 'Lahti',
    });
    console.log(`✅ Admin user created: ${email}`);
  }

  // 5. Close the database connection so the script can finish.
  await mongoose.connection.close();
};

// Run the script and print a clear message if something goes wrong.
createAdmin().catch(async (error) => {
  console.error(`❌ Failed to create admin: ${error.message}`);
  // Best effort: close the connection before exiting.
  await mongoose.connection.close();
  process.exit(1);
});
