import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Henry's personality system prompt
const HENRY_SYSTEM_PROMPT = `You are Henry Hunter, author of "Sourdough for the Rest of Us" and founder of the "Baking Great Bread at Home" community with 50,000+ members.

Your teaching philosophy:
- Perfection is NOT required
- Baking should be accessible, not intimidating
- Use practical, real-world advice
- Speak like a friend, not a textbook
- Share personal stories and anecdotes
- Call out common myths and misconceptions

Your voice:
- Warm, encouraging, and slightly irreverent
- Use phrases like "your pet yeast", "drama queen signal", "don't be a hydration hero"
- Confident without being preachy
- Honest about when things go wrong
- Emphasize that everyone's bread journey is different

Key concepts from your book:
- Fermentolyse (your preferred method over strict autolyse)
- The Float Test
- Flexible schedules (9-to-5, Weekend Warrior, Night Owl)
- Starter as "The Beast" - it's resilient, not fragile
- Hooch is just your starter being dramatic

When answering:
1. Start with encouragement
2. Give practical, actionable advice
3. Share a relevant tip from your book or experience
4. End with confidence-building reassurance

You reference your book, blog (bakinggreatbread.blog), YouTube channel, and Facebook group naturally.`;

// ====================
// CHAT ENDPOINT
// ====================
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Initialize the model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Build chat history
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: HENRY_SYSTEM_PROMPT }]
        },
        {
          role: 'model',
          parts: [{ text: "Got it! I'm Henry, and I'm here to help you bake great bread without the drama. What's on your mind?" }]
        },
        ...history.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        }))
      ]
    });

    // Send message and get response
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    res.json({ response: text });
  } catch (error) {
    console.error('Gemini API error:', error);
    res.status(500).json({ 
      error: 'Failed to get response from AI',
      details: error.message 
    });
  }
});

// ====================
// YOUTUBE ENDPOINTS
// ====================

// Search YouTube videos
app.post('/api/youtube/search', async (req, res) => {
  try {
    const { query, maxResults = 5 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    searchUrl.searchParams.append('part', 'snippet');
    searchUrl.searchParams.append('type', 'video');
    searchUrl.searchParams.append('maxResults', maxResults.toString());
    searchUrl.searchParams.append('q', query);
    searchUrl.searchParams.append('key', process.env.YOUTUBE_API_KEY);

    const response = await fetch(searchUrl.toString());
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'YouTube API request failed');
    }

    // Transform the data to include embeddable info
    const videos = (data.items || []).map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.medium.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      embedUrl: `https://www.youtube.com/embed/${item.id.videoId}`
    }));

    res.json({ videos });
  } catch (error) {
    console.error('YouTube API error:', error);
    res.status(500).json({ 
      error: 'Failed to search YouTube',
      details: error.message 
    });
  }
});

// Get specific video details
app.get('/api/youtube/video/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;

    const videoUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
    videoUrl.searchParams.append('part', 'snippet,contentDetails,statistics');
    videoUrl.searchParams.append('id', videoId);
    videoUrl.searchParams.append('key', process.env.YOUTUBE_API_KEY);

    const response = await fetch(videoUrl.toString());
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'YouTube API request failed');
    }

    const video = data.items?.[0];
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.json({
      id: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      thumbnail: video.snippet.thumbnails.high.url,
      channelTitle: video.snippet.channelTitle,
      publishedAt: video.snippet.publishedAt,
      duration: video.contentDetails.duration,
      viewCount: video.statistics.viewCount,
      embedUrl: `https://www.youtube.com/embed/${video.id}`
    });
  } catch (error) {
    console.error('YouTube API error:', error);
    res.status(500).json({ 
      error: 'Failed to get video details',
      details: error.message 
    });
  }
});

// ====================
// GOOGLE IMAGE SEARCH
// ====================
app.post('/api/images/search', async (req, res) => {
  try {
    const { query, num = 5 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const searchUrl = new URL('https://www.googleapis.com/customsearch/v1');
    searchUrl.searchParams.append('q', query);
    searchUrl.searchParams.append('cx', process.env.GOOGLE_SEARCH_ENGINE_ID);
    searchUrl.searchParams.append('searchType', 'image');
    searchUrl.searchParams.append('key', process.env.GOOGLE_SEARCH_API_KEY);
    searchUrl.searchParams.append('num', num.toString());

    const response = await fetch(searchUrl.toString());
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Google Search API request failed');
    }

    const images = (data.items || []).map(item => ({
      title: item.title,
      link: item.link,
      thumbnail: item.image.thumbnailLink,
      width: item.image.width,
      height: item.image.height,
      contextLink: item.image.contextLink
    }));

    res.json({ images });
  } catch (error) {
    console.error('Google Image Search error:', error);
    res.status(500).json({ 
      error: 'Failed to search images',
      details: error.message 
    });
  }
});

// ====================
// HEALTH CHECK
// ====================
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    endpoints: {
      chat: '/api/chat',
      youtubeSearch: '/api/youtube/search',
      youtubeVideo: '/api/youtube/video/:videoId',
      imageSearch: '/api/images/search'
    }
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🍞 Crust & Crumb Backend running on http://localhost:${PORT}`);
  console.log(`✅ Gemini API: ${process.env.GEMINI_API_KEY ? 'Configured' : 'Missing'}`);
  console.log(`✅ YouTube API: ${process.env.YOUTUBE_API_KEY ? 'Configured' : 'Missing'}`);
  console.log(`✅ Google Search: ${process.env.GOOGLE_SEARCH_API_KEY ? 'Configured' : 'Missing'}`);
});
