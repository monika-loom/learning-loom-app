// This is our secure middleman server function (api/gemini.js)

export default async function handler(request, response) {
  // First, check that the request is coming from our app
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  // Get the secret API key from an environment variable
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return response.status(500).json({ error: 'API key not configured.' });
  }

  // Figure out which Google API to call based on the request from the frontend
  const { endpoint, payload } = request.body;
  let googleApiUrl;

  // Select the correct Google API URL
  if (endpoint === 'text') {
    googleApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
  } else if (endpoint === 'image') {
    // NOTE: The image API URL in your original file was slightly different. This is the common one.
    googleApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;
  } else if (endpoint === 'tts') {
    googleApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/text-to-speech:synthesizeText?key=${apiKey}`;
  } else {
    return response.status(400).json({ error: 'Invalid endpoint specified.' });
  }

  try {
    // Forward the request to the actual Google API
    const googleResponse = await fetch(googleApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await googleResponse.json();

    // Check for errors from Google's side
    if (!googleResponse.ok) {
      console.error('Google API Error:', data);
      return response.status(googleResponse.status).json({ error: 'Error from Google API', details: data });
    }

    // Send the successful response back to our frontend app
    return response.status(200).json(data);

  } catch (error) {
    console.error('Server error:', error);
    return response.status(500).json({ error: 'Internal Server Error' });
  }
}