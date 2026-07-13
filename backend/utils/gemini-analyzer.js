const { GoogleGenAI } = require('@google/genai');

// Gather all available API keys from the environment
const apiKeys = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2
].filter(Boolean); // Removes empty or undefined keys

if (apiKeys.length === 0) {
  console.warn("WARNING: No GEMINI_API_KEY found in environment variables.");
}

// Create a GoogleGenAI instance for every key you provide
const aiInstances = apiKeys.map(key => new GoogleGenAI({ apiKey: key }));
let currentKeyIndex = 0;

// Internal helper to sleep
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Call Gemini with retries and JSON-mode enabled
async function callWithRetries(
  contents,
  { attempts = 3, baseDelayMs = 600 } = {}
) {
  // Hardcoding to the exact stable version to prevent environment variable ghosting
  const modelsToTry = [
    "gemini-2.0-flash",
  ];
  let lastErr;
  let keysSwapped = 0;

  for (const modelName of modelsToTry) {
    for (let i = 0; i < attempts; i++) {
      try {
        // Use the currently active API key
        const ai = aiInstances[currentKeyIndex];

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

          // If we have multiple keys and haven't tried them all yet for this request, swap instantly!
          if (aiInstances.length > 1 && keysSwapped < aiInstances.length - 1) {
            console.log(`\n⚠️ Quota exceeded! Swapping to Backup API Key...`);
            currentKeyIndex = (currentKeyIndex + 1) % aiInstances.length;
            keysSwapped++;
            i--; // Don't waste an attempt count on a key swap
            continue;
          }

          if (i < attempts - 1) {
            const delay = baseDelayMs * Math.pow(2, i) + Math.floor(Math.random() * 200);
            await sleep(delay);
            continue;
          }
          // Out of retries for Quota.
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
