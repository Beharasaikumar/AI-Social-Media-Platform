import { Router, Response } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

const MODEL = "llama-3.3-70b-versatile";

router.post("/search-summary", authenticate, async (req: AuthRequest, res: Response) => {
  const { query, posts } = req.body;
  if (!query || !posts?.length) return res.json({ summary: "" });

  try {
    const Groq = (await import("groq-sdk")).default;
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const postList = posts
      .map((p: any, i: number) => `${i + 1}. "${p.content}" — by ${p.author}`)
      .join("\n");

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant for a college social platform. Given a search query and matching posts, write a single concise sentence (max 30 words) summarizing what people are saying about that topic. Be friendly and campus-appropriate.",
        },
        {
          role: "user",
          content: `Search query: "${query}"\n\nMatching posts:\n${postList}`,
        },
      ],
      max_tokens: 80,
    });

    res.json({ summary: completion.choices[0].message.content });
  } catch (err: any) {
    res.status(500).json({ summary: "" });
  }
});

router.post("/rewrite-tone", authenticate, async (req: AuthRequest, res: Response) => {
  const { text, tone, customInstruction } = req.body;
  if (!text?.trim()) return res.status(400).json({ message: "Text required" });

  try {
    const Groq = (await import("groq-sdk")).default;
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const toneGuides: Record<string, string> = {
      casual:       "casual, friendly, conversational — like texting a friend",
      formal:       "professional and formal — suitable for LinkedIn or an email",
      enthusiastic: "super excited, energetic, use exclamation points, hype it up",
      witty:        "clever, witty, add a touch of humor and personality",
      empathetic:   "warm, empathetic, emotionally aware and supportive",
      concise:      "extremely concise and punchy — cut to the core idea in 1-2 sentences",
    };

    const toneDesc = toneGuides[tone] || "natural and clear";
    const extra    = customInstruction ? `\nAdditional instruction: ${customInstruction}` : "";

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `You are a writing assistant for a college social media platform. Rewrite the user's text in a ${toneDesc} style. Keep the core message intact. Return ONLY the rewritten text, no explanations.${extra}`,
        },
        { role: "user", content: text },
      ],
      max_tokens: 200,
    });

    res.json({ result: completion.choices[0].message.content?.trim() });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;