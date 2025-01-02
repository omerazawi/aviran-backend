const express = require("express");
const {MessageSchema} = require('../models/MessageModel')
const jwt = require('jsonwebtoken');
const {UserSchema} = require('../models/UserModel');

const router = express.Router();


router.post('/login', async (req, res) => {
  const { UserName, Password } = req.body;

  try {
      const user = await UserSchema.findOne({ UserName });
      if (!user) {
          return res.status(401).json({ message: 'שם משתמש או סיסמה שגויים' });
      }

      const token = jwt.sign({ userId: user._id }, 'your_secret_key', { expiresIn: '1h' });
      res.json({ token });
  } catch (error) {
      console.error(error); 
      res.status(500).json({ message: 'שגיאה בשרת' });
  }
});

router.get('/get-message', async (req, res) => {
  try {
    const FindMessage = await MessageSchema.find({});

    // אם לא נמצאו הודעות
    if (FindMessage.length === 0) {
      return res.json({ message: 'לא נמצאה הודעה' });
    }

    // אם נמצאה הודעה, מחזירים את ההודעה הראשונה
    return res.json({ message: FindMessage[0].Message });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'שגיאה בשרת' });
  }
});

router.post("/new-message", async (req, res) => {
  try {
    const { Message } = req.body;

    // Validate that the Message field is provided
    if (!Message) {
      return res.status(400).json({ error: "Message field is required" });
    }

    // Define the filter for finding the document (e.g., first document or specific criteria)
    const filter = {}; // Adjust this filter as needed for specific behavior
    const update = { Message };
    const options = { upsert: true, new: true };

    // Find and update the document, or create it if it doesn't exist
    const message = await MessageSchema.findOneAndUpdate(filter, update, options);

    res.status(200).json(message);
  } catch (error) {
    console.error("Error creating or updating message:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;