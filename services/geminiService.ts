
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getSetupGuidance(prompt: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: `You are an expert IoT and Embedded Systems Engineer. 
        Your goal is to help users set up their ESP8266 to be controlled by a web application over a local network.
        Always provide clear, technical advice. 
        If they ask for code, ensure it uses the ESP8266WebServer library and handles CORS correctly (Access-Control-Allow-Origin: *).
        Explain things like IP addresses, local networks, and how to find the ESP8266's IP in the Serial Monitor.`,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm sorry, I encountered an error while processing your request. Please check your connection.";
  }
}
