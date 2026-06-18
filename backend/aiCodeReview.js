const { GoogleGenAI }= require("@google/genai");
const dotenv = require("dotenv");

dotenv.config();

const ai = new GoogleGenAI({apiKey: process.env.GOOGLE_GEMINI_API_KEY});

const aiCodeReview = async (code) => {
    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `Review the following code and provide detailed feedback on correctness, efficiency, and style: ${code}`,
    });
    return response.text;
}

module.exports = aiCodeReview;