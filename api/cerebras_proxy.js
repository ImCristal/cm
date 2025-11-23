import express from "express";
import { Cerebras } from "cerebras.cloud.sdk";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

const client = new Cerebras({
  api_key: process.env.CEREBRAS_API_KEY,
});

router.post("/", async (req, res) => {
  const prompt = req.body.prompt;

  try {
    const completion = await client.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-oss-120b",
    });

    const reply = completion.choices[0].message.content;

    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: "Error de la IA", details: err.message });
  }
});

export default router;
