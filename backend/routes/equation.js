const express = require('express');
const { analyzeEquation } = require('../utils/gemini-analyzer');

const router = express.Router();

router.post('/parse-equation', async (req, res) => {
  try {
    const { image, text } = req.body;

    if (!image && !text) {
      return res.status(400).json({ error: 'Image or text is required' });
    }

    const result = await analyzeEquation(image, text);
    res.status(200).json(result);

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

module.exports = router;
