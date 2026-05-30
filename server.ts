import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Helper to wrap raw 24kHz 16-bit Mono PCM to a playable WAV file chunk
function pcmToWav(pcmData: Buffer, sampleRate: number = 24000): Buffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8; // 24000 * 1 * 2 / 8 = 48000
  const blockAlign = (numChannels * bitsPerSample) / 8; // 1 * 2 = 2
  const dataSize = pcmData.length;
  const header = Buffer.alloc(44);

  // RIFF identifier
  header.write("RIFF", 0);
  // file length minus 8 bytes (36 + dataSize)
  header.writeUInt32LE(36 + dataSize, 4);
  // WAVE identifier
  header.write("WAVE", 8);
  // fmt chunk
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // format chunk size
  header.writeUInt16LE(1, 20); // 1 = PCM
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  // data chunk
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmData]);
}

// Lazy initialization of Gemini client
let aiInstance: GoogleGenAI | null = null;
function getAiClient() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing. Please configure it in your Secrets panel.");
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

// API Endpoint 1: Generate Professional Uzbek Ad Copy
app.post("/api/generate-copy", async (req: Request, res: Response): Promise<void> => {
  try {
    const { product, audience, tone, extraNotes, languageRule } = req.body;
    const ai = getAiClient();

    const scriptLanguage = languageRule === "cyrillic" ? "kirill (Cyrillic)" : "lotin (Latin)";

    const prompt = `Siz professional O'zbek reklama kopirayterisiz.
Quyidagi ma'lumotlar asosida tijoriy reklama, e'lon yoki radio/TV ovozlashtirish dasturlari uchun professional o'zbekcha reklama ssenariylari yaratasiz. Matn O'zbek tilida, faqat ${scriptLanguage} yozuvida bo'lishi shart!

Mijoz Ma'lumotlari:
- Mahsulot yoki xizmat nomi: ${product || "Ajoyib Taklif"}
- Maqsadli auditoriya: ${audience || "O'zbekiston ahli"}
- Reklama ohangi (Tone/Mood): ${tone || "Ishonchli va Jozibador"}
- Qo'shimcha maxsus talablar: ${extraNotes || "Yo'q"}

Siz har xil xarakterga mo'ljallangan 3 xil variantda professional ssenariy loyihalarini qaytarishingiz kerak:
1. Premium & Elegant (Brend obro'si uchun, 15 soniyalik reklama, o'rtacha tezlikda o'qish xususiyati bor)
2. Dynamic & Energetic (Aktsiyalar, chegirmalar yoki shoshilinch xabarlar uchun, 30 soniyalik reklama)
3. Persuasive & Narrative (Batafsil tushuntirish va mijozni ishontirish uchun, 45-60 soniyalik matn)

Har bir ssenariy ichidagi [shovqin], [pauza] yoki [hissiyot] kabi belgilardan foydalanib, diktor nima qilish kerakligini ko'rsatib keling. Zero bu professional audio ad bo'ladi.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert Uzbek marketing copywriter. Return exclusively valid JSON according to the schema provided. No markdown code blocks around raw JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Script type, e.g. '1-Variant: Premium (15 Soniya)'" },
              text: { type: Type.STRING, description: "The continuous Uzbek script to be synthesized" },
              duration: { type: Type.STRING, description: "Estimated reading time, e.g. '15-20 soniya'" },
              styleNotes: { type: Type.STRING, description: "Guidance for the voiceover voice, e.g. 'Tinch, xotirjam va jozibali'" },
            },
            required: ["title", "text", "duration", "styleNotes"],
          },
        },
      },
    });

    const parsedJsonStr = response.text || "[]";
    const data = JSON.parse(parsedJsonStr);
    res.json({ success: true, scripts: data });
  } catch (error: any) {
    console.error("Ad Copy Generation Error:", error);
    res.status(500).json({ success: false, error: error.message || "Ssenariyni yaratib bo'lmadi" });
  }
});

// API Endpoint 2: Text to Speech Generation
app.post("/api/generate-tts", async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, voice, toneInstructions } = req.body;
    if (!text || text.trim() === "") {
      res.status(400).json({ success: false, error: "Text is empty" });
      return;
    }

    const ai = getAiClient();
    const activeVoice = voice || "Kore"; 

    // Build optimized instructions for voice synthesis in Uzbek style.
    // Specifying tone, style guide and pronunciations
    const speechInstruction = `Say with professional broadcast voiceover standards in Uzbek:
- Emotional Guidance: ${toneInstructions || "Professional, confident commercial and persuasive voiceover style."}
- Articulation: Clear, native Uzbek accentuation. Emphasize punchy keywords.
- Text: "${text}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: speechInstruction }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: activeVoice },
          },
        },
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    const base64Audio = part?.inlineData?.data;

    if (!base64Audio) {
      res.status(500).json({ success: false, error: "Dastur orqali ovoz yaratilmadi. Iltimos, qayta urinib ko'ring." });
      return;
    }

    // Convert raw PCM standard base64 to complete playable WAV base64
    const pcmBuffer = Buffer.from(base64Audio, "base64");
    const wavBuffer = pcmToWav(pcmBuffer, 24000);
    const wavBase64 = wavBuffer.toString("base64");

    res.json({
      success: true,
      audioUrl: `data:audio/wav;base64,${wavBase64}`,
      durationEst: Math.round(pcmBuffer.length / (24000 * 2)), // 16-bit Mono is 2 bytes per sample
    });
  } catch (error: any) {
    console.error("TTS Generation Error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Tizimda professional ovoz yuklashda xatolik yuz berdi"
    });
  }
});

// Serve frontend assets in production or boot Vite server in development
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Uzbek Ad Studio running on http://localhost:${PORT}`);
  });
};

startServer();
