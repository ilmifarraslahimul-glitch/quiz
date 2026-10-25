import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to get GoogleGenAI instance
function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server. Please add GEMINI_API_KEY to Secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// AI Status Check Endpoint
app.get('/api/ai/status', (req, res) => {
  const isConfigured = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 5);
  res.json({
    configured: isConfigured,
    model: 'gemini-3.8-flash',
  });
});

// A. AI Generate Distractor Options
app.post('/api/ai/generate-options', async (req, res) => {
  try {
    const { question, correctAnswer, count = 3, context } = req.body;

    if (!question || !correctAnswer) {
      return res.status(400).json({ error: 'Question and correctAnswer are required.' });
    }

    const ai = getAiClient();

    const prompt = `Anda adalah asisten AI pembuat soal quiz edukasi QuizKu yang cerdas dan teliti.
Tugas Anda adalah membuat ${count} pilihan jawaban salah (distractor) yang masuk akal, edukatif, dan realistis untuk pertanyaan berikut:

Pertanyaan: "${question}"
Jawaban Benar yang Tetap: "${correctAnswer}"
${context ? `Konteks/Materi Tambahan: "${context}"` : ''}

SYARAT MUTLAK:
1. Jawaban salah HARUS berbeda dari jawaban benar ("${correctAnswer}").
2. Antara pilihan salah tidak boleh ada yang bernilai sama atau sinonim duplikat.
3. Pilihan salah harus tampak masuk akal (plausible distractors) bagi siswa yang belum paham atau salah hitung tipikal.
4. Format output JSON dengan array string berisi ${count} pilihan salah. Jangan menyertakan jawaban benar di dalam array ini.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            distractors: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Daftar pilihan jawaban salah yang masuk akal',
            },
            reasoning: {
              type: Type.STRING,
              description: 'Alasan pemilihan distractor',
            },
          },
          required: ['distractors'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const distractors = (parsed.distractors || []).filter(
      (opt: string) => opt.trim().toLowerCase() !== correctAnswer.trim().toLowerCase()
    );

    return res.json({
      success: true,
      distractors,
      reasoning: parsed.reasoning || '',
    });
  } catch (error: any) {
    console.error('Error generating options:', error);
    return res.status(500).json({
      error: error.message || 'Gagal menghasilkan opsi jawaban dengan AI.',
    });
  }
});

// B. AI Quiz Generator (Batch up to 25 questions)
app.post('/api/ai/generate-quiz', async (req, res) => {
  try {
    const {
      topic,
      category = 'Umum',
      count = 5,
      difficulty = 'Sedang',
      questionType = 'multiple_choice',
      optionCount = 4,
      duration = 20,
      language = 'Bahasa Indonesia',
      referenceText = '',
    } = req.body;

    const validatedCount = Math.min(Math.max(1, Number(count) || 5), 25);
    const ai = getAiClient();

    const prompt = `Anda adalah kurator dan pembuat quiz edukasi QuizKu tingkat profesional.
Buatlah ${validatedCount} butir soal quiz berkualitas tinggi dengan spesifikasi berikut:

- Topik: ${topic}
- Kategori: ${category}
- Tingkat Kesulitan: ${difficulty}
- Tipe Soal: ${questionType} (pilihan ganda)
- Jumlah Opsi per Soal: ${optionCount} opsi
- Durasi Saran per Soal: ${duration} detik
- Bahasa: ${language}
${referenceText ? `- Referensi Bahan/Materi: "${referenceText}"` : ''}

Ketentuan:
1. Soal harus mendidik, jelas, tidak ambigu, dan memiliki satu jawaban benar yang pasti.
2. Setiap soal memiliki ${optionCount} pilihan jawaban unik.
3. Kunci jawaban (correctAnswer) harus ada persis di dalam array pilihan (options).
4. Berikan penjelasan singkat namun mendalam mengapa jawaban tersebut benar.
5. Bobot poin default: 10 untuk Mudah, 15 untuk Sedang, 20 untuk Sulit.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              correctAnswer: { type: Type.STRING },
              explanation: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              duration: { type: Type.NUMBER },
              points: { type: Type.NUMBER },
            },
            required: ['question', 'options', 'correctAnswer', 'explanation'],
          },
        },
      },
    });

    const parsed = JSON.parse(response.text || '[]');
    const formattedQuestions = parsed.map((q: any, idx: number) => {
      // Ensure correctAnswer is in options
      let opts = Array.isArray(q.options) ? q.options : [];
      if (!opts.includes(q.correctAnswer)) {
        opts.push(q.correctAnswer);
      }
      return {
        id: `ai_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
        question: q.question,
        questionType: 'multiple_choice',
        options: opts,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || 'Pembahasan telah disediakan oleh AI QuizKu.',
        difficulty: q.difficulty || difficulty,
        duration: q.duration || duration,
        points: q.points || (difficulty === 'Sulit' ? 20 : difficulty === 'Sedang' ? 15 : 10),
      };
    });

    return res.json({
      success: true,
      questions: formattedQuestions,
    });
  } catch (error: any) {
    console.error('Error generating quiz:', error);
    return res.status(500).json({
      error: error.message || 'Gagal menghasilkan kumpulan soal quiz dengan AI.',
    });
  }
});

// C. AI Generate Similar Question
app.post('/api/ai/generate-similar', async (req, res) => {
  try {
    const { originalQuestion } = req.body;

    if (!originalQuestion || !originalQuestion.question) {
      return res.status(400).json({ error: 'Data originalQuestion tidak valid.' });
    }

    const ai = getAiClient();

    const prompt = `Anda adalah ahli pembuat variasi soal edukasi untuk QuizKu.
Tugas Anda adalah mempelajari pola, penalaran, konsep, dan tingkat kesulitan dari soal asli berikut, lalu membuat 1 BUTIR SOAL BARU yang SERUPA (isomorphic question):

SOAL ASLI:
- Pertanyaan: "${originalQuestion.question}"
- Opsi Lama: ${JSON.stringify(originalQuestion.options || [])}
- Jawaban Benar Asli: "${originalQuestion.correctAnswer}"
- Penjelasan Asli: "${originalQuestion.explanation || ''}"
- Kesulitan: "${originalQuestion.difficulty || 'Sedang'}"

PEDOMAN PEMBUATAN:
1. Buat soal BARU dengan konsep atau logika perhitungan yang sama, tetapi menggunakan angka, nama variabel, objek, atau skenario baru.
2. JANGAN hanya mengubah sedikit kata atau menyalin ulang soal. Harus soal yang benar-benar fresh dengan jawaban baru.
3. Buat ${originalQuestion.options?.length || 4} opsi jawaban, dan pastikan kunci jawaban baru ada di dalamnya.
4. Buat penjelasan baru yang runtut.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            correctAnswer: { type: Type.STRING },
            explanation: { type: Type.STRING },
            difficulty: { type: Type.STRING },
            duration: { type: Type.NUMBER },
            points: { type: Type.NUMBER },
          },
          required: ['question', 'options', 'correctAnswer', 'explanation'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    let opts = Array.isArray(parsed.options) ? parsed.options : [];
    if (!opts.includes(parsed.correctAnswer)) {
      opts.push(parsed.correctAnswer);
    }

    const similarQuestion = {
      id: `sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      question: parsed.question,
      questionType: originalQuestion.questionType || 'multiple_choice',
      options: opts,
      correctAnswer: parsed.correctAnswer,
      explanation: parsed.explanation,
      difficulty: parsed.difficulty || originalQuestion.difficulty || 'Sedang',
      duration: parsed.duration || originalQuestion.duration || 20,
      points: parsed.points || originalQuestion.points || 15,
    };

    return res.json({
      success: true,
      question: similarQuestion,
    });
  } catch (error: any) {
    console.error('Error generating similar question:', error);
    return res.status(500).json({
      error: error.message || 'Gagal membuat soal serupa dengan AI.',
    });
  }
});

// D. AI Quality Checker
app.post('/api/ai/review-quality', async (req, res) => {
  try {
    const { question, options, correctAnswer, questionType } = req.body;

    if (!question || !correctAnswer) {
      return res.status(400).json({ error: 'Pertanyaan dan jawaban benar harus diisi.' });
    }

    const ai = getAiClient();

    const prompt = `Anda adalah pemeriksa kualitas kurikulum dan soal quiz QuizKu.
Evaluasi kualitas butir soal berikut:

Pertanyaan: "${question}"
Tipe: "${questionType || 'Pilihan Ganda'}"
Pilihan Jawaban: ${JSON.stringify(options || [])}
Jawaban Benar yang Ditetapkan: "${correctAnswer}"

Periksa dengan teliti:
1. Apakah jawaban benar memang faktual atau matematis akurat?
2. Apakah ada opsi yang ganda atau bermakna sama?
3. Apakah pertanyaannya ambigu atau membingungkan?
4. Apakah ada typo/kesalahan tata bahasa?
5. Berapa tingkat kesulitan yang disarankan (Mudah / Sedang / Sulit)?
6. Tuliskan penjelasan jawaban yang komprehensif.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isValid: { type: Type.BOOLEAN },
            issues: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            recommendedDifficulty: { type: Type.STRING },
            improvedExplanation: { type: Type.STRING },
          },
          required: ['isValid', 'issues', 'suggestions', 'recommendedDifficulty', 'improvedExplanation'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      success: true,
      review: parsed,
    });
  } catch (error: any) {
    console.error('Error reviewing quality:', error);
    return res.status(500).json({
      error: error.message || 'Gagal memeriksa kualitas soal dengan AI.',
    });
  }
});

// Vite Middleware Integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`QuizKu server running on port ${PORT}`);
  });
}

startServer();
