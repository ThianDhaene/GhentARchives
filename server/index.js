import http from 'http';
import https from 'https';
import url from 'url';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3000;

// Enable CORS for all routes (you can restrict it by providing the origin as an option)
app.use(cors());

function getFinalUrl(inputUrl) {
  return new Promise((resolve, reject) => {
    const { protocol } = url.parse(inputUrl);
    const client = protocol === 'https:' ? https : http;

    const request = client.get(inputUrl, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        const redirectUrl = url.resolve(inputUrl, response.headers.location);
        resolve(getFinalUrl(redirectUrl)); // Recursive call for redirects
      } else {
        resolve(inputUrl); // Final URL reached
      }
    });

    request.on('error', (err) => reject(err));
  });
}

app.get('/unshorten', async (req, res) => {
  const { targetUrl } = req.query;
  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing targetUrl parameter' });
  }

  try {
    const finalUrl = await getFinalUrl(targetUrl);
    res.json({ finalUrl });
  } catch (error) {
    res.status(500).json({ error: 'Failed to unshorten URL', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`URL Unshortener API running on http://localhost:${PORT}`);
});
