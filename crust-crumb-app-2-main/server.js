import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai'; // Adjusted import

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Example route using the OpenAI client
app.post('/api/ai-chat', async (req, res) => {
  try {
    const { query } = req.body;
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: query }],
    });

    res.json({ response: completion.choices[0].message.content });
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ error: 'An error occurred while processing your request' });
  }
});

// YouTube Video Search Endpoint
app.post('/api/youtube-search', async (req, res) => {
  try {
    const { query } = req.body;
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q=${encodeURIComponent(query)}&key=${process.env.YOUTUBE_API_KEY}`
    );
    const data = await response.json();
    res.json({ videos: data.items || [] });
  } catch (error) {
    console.error('YouTube API error:', error);
    res.status(500).json({ error: 'Failed to search YouTube' });
  }
});

// Google Custom Search Endpoint for Images
app.post('/api/image-search', async (req, res) => {
  try {
    const { query } = req.body;
    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&cx=${process.env.GOOGLE_SEARCH_ENGINE_ID}&searchType=image&key=${process.env.GOOGLE_SEARCH_API_KEY}&num=5`
    );
    const data = await response.json();
    res.json({ images: data.items || [] });
  } catch (error) {
    console.error('Google Search API error:', error);
    res.status(500).json({ error: 'Failed to search for images' });
  }
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
