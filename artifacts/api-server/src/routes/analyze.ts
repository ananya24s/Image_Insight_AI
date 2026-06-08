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

const VALID_CATEGORIES = [
  "electronics",
  "furniture",
  "vehicles",
  "food",
  "documents",
  "people_portraits",
  "nature_outdoors",
  "other",
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  electronics: "Electronics",
  furniture: "Furniture",
  vehicles: "Vehicles",
  food: "Food",
  documents: "Documents",
  people_portraits: "People / Portraits",
  nature_outdoors: "Nature / Outdoors",
  other: "General Subject",
};

function buildPrompt(category: string): string {
  const label = CATEGORY_LABELS[category] ?? "subject";

  const prompts: Record<string, string> = {
    electronics: `You are an expert electronics technician. Analyze this image of an electronic device or component. Identify any damage, wear, faults, or issues. Provide actionable repair or maintenance suggestions.`,
    furniture: `You are an expert furniture appraiser and restoration specialist. Analyze this image of furniture. Identify any damage, wear, structural issues, or style concerns. Suggest restoration or improvement steps.`,
    vehicles: `You are an expert automotive and vehicle inspector. Analyze this image of a vehicle or vehicle component. Identify any visible damage, wear, mechanical issues, or safety concerns. Suggest maintenance or repair actions.`,
    food: `You are a professional food safety inspector and culinary expert. Analyze this image of food. Identify freshness, quality, presentation issues, or safety concerns. Provide recommendations for improvement or handling.`,
    documents: `You are a document analysis expert. Analyze this image of a document. Identify legibility issues, damage, completeness concerns, or formatting problems. Suggest improvements or preservation steps.`,
    people_portraits: `You are a professional photographer and portrait analyst. Analyze this image of a person or portrait. Identify composition, lighting, focus, and presentation strengths and weaknesses. Suggest improvements for the photo or presentation.`,
    nature_outdoors: `You are a professional nature photographer and environmental analyst. Analyze this outdoor or nature image. Identify composition, lighting, subject matter, and any environmental observations. Suggest photography improvements or note interesting features.`,
    other: `You are a professional image analyst. Analyze this image thoroughly. Identify the subject matter, notable features, any issues or concerns visible, and provide relevant observations and suggestions.`,
  };

  const basePrompt = prompts[category] ?? prompts.other;

  return `${basePrompt}

Respond ONLY with a valid JSON object (no markdown, no code fences) in this exact format:
{
  "analysisText": "A 2-3 sentence professional summary of what you observe in the image.",
  "issues": ["Issue or observation 1", "Issue or observation 2"],
  "suggestions": ["Suggestion 1", "Suggestion 2"]
}

Guidelines:
- "analysisText": Objective, professional overview of what you see. Mention the subject, condition, and key observations.
- "issues": List 2-5 specific problems, damage, wear, or notable observations. Be precise. If nothing is wrong, return ["No significant issues detected"].
- "suggestions": List 2-5 actionable recommendations. If no issues, return ["Subject appears to be in good condition."].

Be concise, accurate, and professional.`;
}

router.post("/analyze", upload.single("image"), async (req, res) => {
  const file = req.file;
  const category = req.body?.category as string | undefined;

  if (!file) {
    res.status(400).json({ error: "No image file provided" });
    return;
  }

  if (!category || !(VALID_CATEGORIES as readonly string[]).includes(category)) {
    res.status(400).json({ error: `Invalid or missing category. Must be one of: ${VALID_CATEGORIES.join(", ")}` });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    req.log.error("GEMINI_API_KEY not configured");
    res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server" });
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
      req.log.warn({ rawText }, "Failed to parse Gemini JSON response, using raw text");
      parsed = {
        analysisText: rawText || "Analysis complete.",
        issues: ["Structured response unavailable — see summary above"],
        suggestions: ["Try again with a clearer, well-lit image"],
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
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: `Failed to analyze image: ${message}` });
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
