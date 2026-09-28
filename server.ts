import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.post("/api/chat", async (req, res) => {
    try {
      const { prompt, history, context } = req.body;
      
      const systemInstruction = `You are a professional co-writer and editor AI. You are collaborating with a human author on a novel. 
      You will be provided with the current context of the novel (synopsis, characters, chapter content). 
      Be helpful, creative, and focus on maintaining tone, exploring character arcs, and suggesting improvements.
      
      CURRENT CONTEXT:
      ${context}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [...history, { role: "user", parts: [{ text: prompt }] }],
        config: {
          systemInstruction,
        }
      });
      
      res.json({ text: response.text });
    } catch (error) {
      console.error("AI Error:", error);
      res.status(500).json({ error: "Failed to generate AI response" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
