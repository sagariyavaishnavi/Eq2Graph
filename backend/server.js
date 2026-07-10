const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenAI } = require('@google/genai');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

app.post('/api/parse-equation', async (req, res) => {
  try {
    const { image, text } = req.body;

    if (!image && !text) {
      return res.status(400).json({ error: 'Image or text is required' });
    }

    let prompt = `You are a mathematical parser. The user has provided an input which may be a hand-drawn image of an equation, a typed equation, or a word problem (such as a chemical reaction, physics problem, etc.).
Your task is to extract the mathematical equation(s) from the input and return ONLY a valid JSON object. Do not include markdown formatting like \`\`\`json.
The JSON should follow this format:
{
  "equations": ["y = x^2", "y = sin(x)"]
}
Only use standard math notation compatible with 'math.js'. Do not include variables other than x and y for graphing functions.
If the input is a word problem, extract the underlying mathematical relationship as an equation in terms of x and y.`;

    let result;

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
      
      result = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [prompt, imagePart]
      });
    } else {
      result = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [prompt, `User Input: ${text}`]
      });
    }

    const textOutput = result.text;
    
    // Attempt to parse the JSON
    try {
      const cleanJson = textOutput.replace(/```json\n?|```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      res.json(parsed);
    } catch (e) {
      console.error('Failed to parse Gemini output as JSON:', textOutput);
      res.status(500).json({ error: 'Failed to parse equation format', raw: textOutput });
    }

  } catch (error) {
    console.error('Error processing request:', error);
    let errorMsg = 'Internal Server Error';
    if (error.message) {
      if (error.message.includes('quota') || error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED')) {
        errorMsg = 'Free quota is exceeded, please try again later';
      } else {
        // Extract just the first line of the error and limit its length
        errorMsg = error.message.split('\n')[0].substring(0, 150);
      }
    }
    res.status(500).json({ error: errorMsg });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
