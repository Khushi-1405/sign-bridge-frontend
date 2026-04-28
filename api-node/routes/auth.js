const router = require("express").Router();
// FIX: Changed "User" to "user" to match your lowercase filename
const User = require("../models/user"); 
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// 📝 REGISTER
router.post("/register", async (req, res) => {
  try {
    // Safety Check: Check if user already exists
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) return res.status(400).json({ error: "Email already registered!" });

    // Generate encrypted password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // Create new user
    const newUser = new User({
      username: req.body.username,
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
      dob: req.body.dob,
    });

    const user = await newUser.save();
    res.status(200).json({ message: "User registered successfully!", userId: user._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔑 LOGIN
router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json("User not found!");

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(400).json("Wrong password!");

    // Ensure JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
        return res.status(500).json("Server Error: JWT_SECRET is missing in environment variables.");
    }

    // Create a Token that expires in 24 hours
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "24h" });

    // Send user data (minus password) and token
    const { password, ...others } = user._doc;
    res.status(200).json({ ...others, token });
  } catch (err) {
    // FIX: Standardize error response to JSON
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;