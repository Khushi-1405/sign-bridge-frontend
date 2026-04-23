const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// 📝 REGISTER
router.post("/register", async (req, res) => {
  try {
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

    // Create a Token that expires in 24 hours
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "24h" });

    // Send user data (minus password) and token
    const { password, ...others } = user._doc;
    res.status(200).json({ ...others, token });
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;