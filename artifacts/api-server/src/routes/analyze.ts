import { Router } from "express";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";
import { db, analysesTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

const CATEGORIES: Record<string, string> = {
  computer_hardware: "Computer / Hardware",
  mobile_device: "Mobile Device",
  general_electronics: "General Electronics",
  other: "General Electronics / Other Device",
};

function buildPrompt(category: string): string {
  const label = CATEGORIES[category] ?? "Electronics";
  return `You are an expert electronics diagnostics technician specializing in ${label} repair and troubleshooting.

Analyze the provided image of a ${label} carefully.

Respond ONLY with a valid JSON object (no markdown, no code fences) in this exact format:
{
  "analysisText": "A 2-3 sentence summary of what you observe in the image, including the device condition and any notable findings.",
  "issues": ["Issue 1", "Issue 2", "Issue 3"],
  "suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
}

Guidelines:
- "analysisText": Provide an objective, professional overview of what you see. Mention the device type, visible condition, and key observations.
- "issues": List specific problems, damage, wear, or anomalies you identify. Be precise and technical. Include 2-5 items. If no issues are found, return ["No visible issues detected"].
- "suggestions": Provide actionable repair, maintenance, or improvement recommendations based on the issues. Include 2-5 items. If no issues, return ["Device appears to be in good condition. Regular maintenance recommended."].

Be concise, accurate, and professional. Focus on what is visible in the image.`;
}

router.post("/analyze", upload.single("image"), async (req, res) => {
  const file = req.file;
  const category = req.body?.category as string | undefined;

  if (!file) {
    res.status(400).json({ error: "No image file provided" });
    return;
  }

  const validCategories = ["computer_hardware", "mobile_device", "general_electronics", "other"];
  if (!category || !validCategories.includes(category)) {
    res.status(400).json({ error: "Invalid or missing category" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    req.log.error("GEMINI_API_KEY not configured");
    res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const base64Image = file.buffer.toString("base64");
    const mimeType = file.mimetype || "image/jpeg";

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Image,
              },
            },
            { text: buildPrompt(category) },
          ],
        },
      ],
    });

    const rawText = response.text ?? "";

    let parsed: { analysisText: string; issues: string[]; suggestions: string[] };
    try {
      const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      req.log.warn({ rawText }, "Failed to parse Gemini JSON response, using fallback");
      parsed = {
        analysisText: rawText || "Analysis complete.",
        issues: ["Unable to parse structured response"],
        suggestions: ["Please try again with a clearer image"],
      };
    }

    const imageData = `data:${mimeType};base64,${base64Image}`;

    const [inserted] = await db
      .insert(analysesTable)
      .values({
        category,
        imageData,
        analysisText: parsed.analysisText,
        issues: JSON.stringify(parsed.issues),
        suggestions: JSON.stringify(parsed.suggestions),
      })
      .returning();

    res.json({
      id: inserted.id,
      category: inserted.category,
      imageData: inserted.imageData,
      analysisText: inserted.analysisText,
      issues: JSON.parse(inserted.issues) as string[],
      suggestions: JSON.parse(inserted.suggestions) as string[],
      createdAt: inserted.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Error analyzing image");
    res.status(500).json({ error: "Failed to analyze image" });
  }
});

router.get("/history", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(analysesTable)
      .orderBy(desc(analysesTable.createdAt));

    const result = rows.map((row) => ({
      id: row.id,
      category: row.category,
      imageData: row.imageData,
      analysisText: row.analysisText,
      issues: JSON.parse(row.issues) as string[],
      suggestions: JSON.parse(row.suggestions) as string[],
      createdAt: row.createdAt.toISOString(),
    }));

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Error fetching history");
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

export default router;
