const { GoogleGenAI } = require("@google/genai");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

async function evaluateAnswer(question, answer) {
  const prompt = `
        You are an expert software engineering interviewer.
        Evaluate this interview answer.
        Please provide a score from 1 to 10, list the strengths and areas for improvement, and suggest a better answer if applicable.
        Question:
        ${question}
        Candidate Answer:
        ${answer}
        Return JSON:
        {
            "score": number,
            "strengths": ["string"],
            "improvements": ["string"],
            "betterAnswer": "string"
        }
        `;
  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });
  return response.text;
}

module.exports = evaluateAnswer;
