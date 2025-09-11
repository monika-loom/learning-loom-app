// This is the new content for api/gemini.js, using Google Gemini

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Method Not Allowed' });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        return response.status(500).json({ error: 'Google API key not configured.' });
    }

    const { endpoint, payload } = request.body;

    // This backend now only handles text generation
    if (endpoint !== 'text') {
        return response.status(400).json({ error: 'This endpoint only supports text generation.' });
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    try {
        const geminiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!geminiResponse.ok) {
            const errorBody = await geminiResponse.json();
            console.error('Google API Error:', errorBody);
            return response.status(geminiResponse.status).json({ error: 'Error from Google API', details: errorBody });
        }

        const data = await geminiResponse.json();
        return response.status(200).json(data);

    } catch (error) {
        console.error('Server error:', error);
        return response.status(500).json({ error: 'Internal Server Error' });
    }
}