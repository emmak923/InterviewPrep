const express = require("express");
const router = express.Router();
const UserModel = require("../models/userModel");
const OTPModel = require("../models/otpModel");
const PasswordResetModel = require("../models/passwordResetModel");
const crypto = require("crypto");
const userValidation = require("../middlewares/userValidation");
const registerRules = require("../middlewares/registerRules");
const loginRules = require("../middlewares/loginRules");
const updateAccountRules = require("../middlewares/updateAccountRules");
const verifyLoginRules = require("../middlewares/verifyLoginRules");
const { matchPassword } = require("../../../utils/password-utils");
const { encodeToken } = require("../../../utils/jwt-utils");
const { randomNumberOfNDigits } = require("../../../utils/compute-utils");
const sendEmail = require("../../../utils/email-utils");
const authorize = require("../../../shared/middlewares/authorize");

// Login Route
router.post("/login", loginRules, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ errorMessage: "Email and password are required" });
    }

    const foundUser = await UserModel.findOne({ email });
    if (!foundUser) {
      return res
        .status(404)
        .json({ errorMessage: `User with ${email} doesn't exist` });
    }

    const passwordMatched = matchPassword(password, foundUser.password);
    if (!passwordMatched) {
      return res
        .status(401)
        .json({ errorMessage: "Email and password didn't match" });
    }

    const otp = randomNumberOfNDigits(6).toString().padStart(6, "0");

    await OTPModel.findOneAndUpdate(
      { email },
      { email, otp, expiresAt: new Date(Date.now() + 1000 * 60 * 10) },
      { upsert: true },
    );

    try {
      await sendEmail(email, "Your OTP Code", `Your OTP is: ${otp}`);
    } catch (mailError) {
      console.error("Failed to send OTP email:", mailError);
      return res.status(500).json({ errorMessage: "Failed to send OTP email" });
    }

    const userPayload = {
      _id: foundUser._id.toString(),
      email: foundUser.email,
      name: foundUser.name,
      role: foundUser.role,
    };

    res.json({ message: "OTP has been sent to your email", user: userPayload });
  } catch (error) {
    console.error("Error in /users/login:", error);
    res.status(500).json({ errorMessage: "Internal Server Error" });
  }
});

// verify login route
router.post("/verify-login", verifyLoginRules, async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res
        .status(400)
        .json({ errorMessage: "Email and OTP are required" });
    }

    const savedOTP = await OTPModel.findOne({ email });
    if (!savedOTP || savedOTP.otp !== otp) {
      return res.status(401).json({ errorMessage: "OTP verification failed" });
    }

    const foundUser = await UserModel.findOne({ email });
    if (!foundUser) {
      return res.status(404).json({ errorMessage: "User not found" });
    }

    const userPayload = {
      _id: foundUser._id.toString(),
      email: foundUser.email,
      name: foundUser.name,
      role: foundUser.role,
    };

    const token = encodeToken(userPayload);

    await OTPModel.deleteOne({ email });

    res.json({ user: userPayload, token });
  } catch (error) {
    console.error("Error in /users/verify-login:", error);
    res.status(500).json({ errorMessage: "Internal Server Error" });
  }
});

// Register route
router.post("/register", registerRules, async (req, res) => {
  try {
    const newUser = req.body;

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email: newUser.email });
    if (existingUser) {
      return res.status(400).json({
        errorMessage: `User with ${newUser.email} already exists`,
      });
    }

    // Create new user
    const addedUser = await UserModel.create(newUser);

    if (!addedUser) {
      return res
        .status(500)
        .send({ errorMessage: `Oops! User couldn't be added!` });
    }

    const user = { ...addedUser.toJSON(), password: undefined };
    res.status(201).json(user);
  } catch (error) {
    console.error("Error in /users/register:", error);
    res.status(500).json({ errorMessage: error.message });
  }
});

// Forgot Password Route
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        errorMessage: "Email is required",
      });
    }

    const foundUser = await UserModel.findOne({ email });

    if (!foundUser) {
      return res.status(404).json({
        errorMessage: "No account found with this email address",
      });
    }

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString("hex");

    // Token expires in 15 minutes
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15);

    await PasswordResetModel.findOneAndUpdate(
      { email },
      {
        email,
        token,
        expiresAt,
      },
      {
        upsert: true,
        new: true,
      },
    );

    const resetLink = `http://localhost:3000/reset-password/${token}`;

    try {
      await sendEmail(
        email,
        "Reset Your InterviewPrep Password",
        `You requested to reset your InterviewPrep password.\n\nPlease click the following link to reset your password:\n\n${resetLink}\n\nThis link will expire in 15 minutes.\n\nIf you did not request a password reset, you can safely ignore this email.`,
      );
    } catch (mailError) {
      console.error("Failed to send password reset email:", mailError);

      return res.status(500).json({
        errorMessage: "Failed to send password reset email",
      });
    }

    res.json({
      message: "Password reset link has been sent to your email",
    });
  } catch (error) {
    console.error("Error in /users/forgot-password:", error);

    res.status(500).json({
      errorMessage: "Internal Server Error",
    });
  }
});

// Reset Password Route
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        errorMessage: "Token and password are required",
      });
    }

    // Find the reset token
    const resetRequest = await PasswordResetModel.findOne({ token });

    if (!resetRequest) {
      return res.status(400).json({
        errorMessage: "Invalid or expired password reset link",
      });
    }

    // Check if token has expired
    if (resetRequest.expiresAt < new Date()) {
      await PasswordResetModel.deleteOne({ token });

      return res.status(400).json({
        errorMessage: "Password reset link has expired",
      });
    }

    // Find the user
    const foundUser = await UserModel.findOne({
      email: resetRequest.email,
    });

    if (!foundUser) {
      return res.status(404).json({
        errorMessage: "User not found",
      });
    }

    // Update password
    // UserSchema.pre("save") will hash the password automatically
    foundUser.password = password;
    await foundUser.save();

    // Delete the reset token so it cannot be reused
    await PasswordResetModel.deleteOne({
      _id: resetRequest._id,
    });

    res.json({
      message: "Password has been reset successfully",
    });
  } catch (error) {
    console.error("Error in /users/reset-password:", error);

    res.status(500).json({
      errorMessage: "Internal Server Error",
    });
  }
});

// Get all users + search + sort + pagination
router.get("/", authorize(["admin"]), async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";
    const filter = search ? { $text: { $search: search } } : {};

    const users = await UserModel.find(filter)
      .select("-password")
      .sort({ name: 1 }) // alphabetical order
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await UserModel.countDocuments(filter);

    res.status(200).json({
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      users,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single user by ID
router.get("/:id", authorize(["admin"]), async (req, res) => {
  const userId = req.params.id;
  try {
    const user = await UserModel.findById(userId).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ message: `User with ID ${userId} not found` });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new user (admin only)
router.post("/", authorize(["admin"]), userValidation, async (req, res) => {
  try {
    const newUser = req.body;
    const addedUser = await UserModel.create({
      name: newUser.name,
      email: newUser.email,
      password: newUser.password,
      role: newUser.role || "user",
    });

    const user = { ...addedUser.toJSON(), password: undefined };
    res.status(201).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Update a user by ID
router.put(
  "/:id",
  authorize(["admin", "user"]),
  updateAccountRules,
  async (req, res) => {
    try {
      const userId = req.params.id;
      const requester = req.user; // JWT decoded

      // users can update only themselves
      if (requester.role === "user" && requester._id.toString() !== userId) {
        return res.status(403).json({
          message: "You cannot update other users.",
        });
      }

      const newUser = req.body;

      const updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        {
          $set: {
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
          },
        },
        { new: true },
      );

      if (!updatedUser) {
        return res
          .status(404)
          .json({ message: `User with ID ${userId} not found` });
      }

      res.status(200).json(updatedUser);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },
);

// Delete a user by ID
router.delete("/:id", authorize(["admin"]), async (req, res) => {
  try {
    const userId = req.params.id;

    const foundUser = await UserModel.findById(userId).select("-password");
    if (!foundUser) {
      return res.status(404).send(`User with ID ${userId} doesn't exist`);
    }

    const deletedUser = await UserModel.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(500).send(`Oops! User couldn't be deleted!`);
    }

    res.status(200).json({
      message: "User deleted successfully",
      deletedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
