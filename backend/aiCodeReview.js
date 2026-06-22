const https = require('https');
const dotenv = require('dotenv');
dotenv.config();

const aiCodeReview = async (code) => {
    const body = JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
            {
                role: 'user',
                content: `Review the following code and provide detailed feedback on correctness, efficiency, and style:\n\n${code}`
            }
        ],
        max_tokens: 1024,
    });

    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.groq.com',
            path: '/openai/v1/chat/completions',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
            },
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.error) return reject(new Error(JSON.stringify(json.error)));
                    resolve(json.choices[0].message.content);
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.write(body);
        req.end();
    });
};

module.exports = aiCodeReview;
