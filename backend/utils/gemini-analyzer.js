const { GoogleGenAI } = require('@google/genai');

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// Internal helper to sleep
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Call Gemini with retries and JSON-mode enabled
async function callWithRetries(
  contents,
  { attempts = 3, baseDelayMs = 600 } = {}
) {
  // Let the user specify a model in .env, otherwise fallback to the one that worked for them
  const modelsToTry = [
    process.env.GEMINI_MODEL || "gemini-2.5-flash",
  ];
  let lastErr;

  for (const modelName of modelsToTry) {
    for (let i = 0; i < attempts; i++) {
      try {
        const result = await ai.models.generateContent({
          model: modelName,
          contents: contents,
          config: {
            responseMimeType: "application/json",
          }
        });
        return result.text;
      } catch (err) {
        lastErr = err;
        const msg = (err?.message || "").toLowerCase();

        // Handle Quota / Rate limit errors
        if (msg.includes("429") || msg.includes("quota") || msg.includes("resource_exhausted")) {
          if (i < attempts - 1) {
            const delay = baseDelayMs * Math.pow(2, i) + Math.floor(Math.random() * 200);
            await sleep(delay);
            continue;
          }
          // Out of retries for Quota. Throw immediately to avoid masking with fallback model errors.
          throw err;
        }

        // Handle Server Overloaded errors
        const isOverloaded = msg.includes("503") || msg.includes("overloaded");
        if (isOverloaded && i < attempts - 1) {
          const delay = baseDelayMs * Math.pow(2, i) + Math.floor(Math.random() * 200);
          await sleep(delay);
          continue; // Retry same model
        }

        // For other errors (like 404 Model Not Found), break and try the next fallback model
        break;
      }
    }
  }

  const error = new Error(lastErr?.message || "Gemini request failed");
  if ((lastErr?.message || "").includes("503")) error.status = 503;
  throw error;
}

// Extract equation structure from text or image
async function analyzeEquation(image, text) {
  let prompt = `You are a mathematical parser. The user has provided an input which may be a hand-drawn image of an equation, a typed equation, or a word problem (such as a chemical reaction, physics problem, etc.).
Your task is to extract the mathematical equation(s) from the input and return ONLY a valid JSON object. Do not include markdown formatting like \`\`\`json.
The JSON should follow this format:
{
  "equations": ["y = x^2", "y = sin(x)"]
}
Only use standard math notation compatible with 'math.js'. Do not include variables other than x and y for graphing functions.
If the input is a word problem, extract the underlying mathematical relationship as an equation in terms of x and y.`;

  let contents;

  if (image) {
    // image is expected to be a base64 string like "data:image/png;base64,iVBORw0KGgo..."
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const mimeType = image.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/png';

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType
      }
    };
    contents = [prompt, imagePart];
  } else {
    contents = [prompt, `User Input: ${text}`];
  }

  const textOutput = await callWithRetries(contents);

  // Attempt to parse the JSON
  const cleanJson = textOutput.replace(/```json\n?|```/g, '').trim();
  return JSON.parse(cleanJson);
}

module.exports = { analyzeEquation };
