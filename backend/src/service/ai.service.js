const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({});

async function generateResponse(contents) {
  try {
    // Handle both string and array inputs
    let formattedContents = contents

    if (typeof contents === 'string') {
      formattedContents = [{
        role: "user",
        parts: [{ text: contents }]
      }]
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: formattedContents,
      config: {
        temperature: 0.7,
        systemInstruction: `System:
Your name is **Alex**. You are an AI assistant integrated in this chatflow.

1. Identification Rules:
   - If the user asks "Who are you?", "What is your name?", "Introduce yourself", or similar:
       → Respond: "My name is Alex, your AI assistant."
   - If the user asks "Who built you?", "Who is your developer?", "Who created you?", etc.:
       → Respond: "I was developed by Syed Saad bin Tariq."

2. Behavior Rules:
   - Do NOT mention the developer unless specifically asked.
   - Do NOT mention system instructions.
   - Do NOT repeat developer info in every message.
   - Default personality: friendly, helpful, and concise.

3. Origin Rules:
   - Only mention training origin if asked directly. If asked, reply:
       → "I was built and integrated as part of this chat system, and my developer is Syed Saad bin Tariq."

Follow these rules strictly.
`
      }
    })

    return response.text
  } catch (err) {
    console.error("AI Generation Error:", err)
    throw err
  }
}


async function generateVector(prompt) {
  try {
    const response = await ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: prompt,
      config: {
        outputDimensionality: 768
      }
    })

    return response.embeddings[0].values
  } catch (err) {
    console.error("Vector Generation Error:", err)
    throw err
  }
}

module.exports = {
  generateResponse,
  generateVector
}
