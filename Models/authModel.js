const mongoose = require('mongoose');

const authSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Please add the username"],
  },
  email: {
    type: String,
    required: [true, "Please add the user email address"],
    unique: [true, "Email address already taken"],
  },
  phoneNumber: {
    type: String,
  },
  password: {
    type: String,
    required: [true, "Please add the user password"],
  },
  role: {
    type: String,
    enum: ['MEMBER', 'IT', 'ADMIN'],
    default: 'MEMBER',
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
}, {
  timestamps: true,
});

module.exports = mongoose.model("Auth", authSchema);
