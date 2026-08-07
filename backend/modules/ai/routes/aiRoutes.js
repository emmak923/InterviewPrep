const express = require("express");
const evaluateAnswer = require("../../../geminiApi");

const router = express.Router();

router.post("/evaluate", async (req, res) => {
  try {
    const { question, answer } = req.body;
    const feedback = await evaluateAnswer(question, answer);

    res.json({ feedback });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "AI evaluation failed" });
  }
});

module.exports = router;
