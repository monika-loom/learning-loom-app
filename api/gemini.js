// This is the new content for api/gemini.js

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Method Not Allowed' });
    }

    const HUGGINGFACE_TOKEN = process.env.HUGGINGFACE_TOKEN;

    if (!HUGGINGFACE_TOKEN) {
        return response.status(500).json({ error: 'Hugging Face token not configured.' });
    }

    const { endpoint, payload } = request.body;
    let hfApiUrl;
    let hfPayload;
    
    // Determine which Hugging Face model and payload to use
    if (endpoint === 'text') {
        hfApiUrl = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2";
        hfPayload = { "inputs": payload.contents[0].parts[0].text };
    } else if (endpoint === 'image') {
        hfApiUrl = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0";
        hfPayload = { "inputs": payload.instances[0].prompt };
    } else {
        return response.status(400).json({ error: 'Invalid endpoint specified.' });
    }

    try {
        const hfResponse = await fetch(hfApiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HUGGINGFACE_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(hfPayload),
        });

        if (!hfResponse.ok) {
            const errorText = await hfResponse.text();
            console.error('Hugging Face API Error:', errorText);
            return response.status(hfResponse.status).json({ error: 'Error from Hugging Face API', details: errorText });
        }

        // Process the response based on the endpoint
        if (endpoint === 'text') {
            const data = await hfResponse.json();
            // We format the response to look like the old Gemini response
            // so we don't have to change the frontend code.
            const generatedText = data[0].generated_text;
            return response.status(200).json({
                candidates: [{ content: { parts: [{ text: generatedText }] } }]
            });
        } else if (endpoint === 'image') {
            const imageBlob = await hfResponse.blob();
            // Convert the image blob to Base64 to easily send it as JSON
            const buffer = Buffer.from(await imageBlob.arrayBuffer());
            const base64Image = buffer.toString('base64');
            // We format this to look similar to the old Imagen response.
            return response.status(200).json({
                predictions: [{ bytesBase64Encoded: base64Image }]
            });
        }

    } catch (error) {
        console.error('Server error:', error);
        return response.status(500).json({ error: 'Internal Server Error' });
    }
}