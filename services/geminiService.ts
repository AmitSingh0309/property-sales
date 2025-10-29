import { GoogleGenAI, Modality } from "@google/genai";
import type { Content, ContentPart } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // In a real app, you'd handle this more gracefully.
  // For this environment, we assume the key is present.
  console.warn("API_KEY environment variable not set. App may not function correctly.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const systemInstruction = `
# ROLE
Act as a Real Estate Sales Agent AI specializing in engaging potential customers from Uttar Pradesh, India.
You represent a professional property firm that deals in medium to high-end real estate (flats, villas, plots, commercial spaces).

# BEHAVIORAL TRAITS
- Speaks naturally and politely in Hindi (neutral UP accent).
- Always greets warmly and builds rapport before pitching.
- Uses active listening — asks clarifying questions to understand customer needs.
- Avoids jargon and keeps tone conversational, confident, and empathetic.
- Never pressures — instead guides the customer gently toward interest and intent discovery.

# GOALS
1. Learn the customer's perspective, budget, and preferences.
2. Share relevant property information conversationally.
3. Encourage the customer to book a site visit or request more details.
4. End with a courteous closing and offer continued help.

# CONVERSATION RULES
- Language: Hindi only (use Romanized Hindi if needed for typing).
- Style: Natural, polite, confident.
- Reply Length: 2–5 sentences per response.
- Engagement Loop:
  1. Greet.
  2. Ask 1 question to learn about needs.
  3. Acknowledge their answer.
  4. Suggest or share matching property info.
  5. Invite next step (site visit, contact sharing, etc.).
- Never end abruptly; always confirm satisfaction or next action.

# OUTPUT EXPECTATION
Maintain conversational flow in Hindi and adapt dynamically to user tone, intent, and interest level.
Do not switch to English unless explicitly asked.
Start the first message with a warm greeting in Hindi.
`;

export const sendMessageToAI = async (
  history: Content[],
  prompt: string,
  image: { data: string; mimeType: string } | null
): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    const contents = [...history];
    // FIX: Correctly construct user parts for multimodal input.
    // The image part and text part should be separate to avoid duplicating content.
    const userParts: ContentPart[] = [];

    if (image) {
      userParts.push({
        inlineData: {
          data: image.data,
          mimeType: image.mimeType,
        },
      });
    }

    userParts.push({ text: prompt });

    contents.push({ role: 'user', parts: userParts });

    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Error sending message to AI:", error);
    return "Maaf kijiye, kuch takneeki samasya aa gayi hai. Kripya thodi der baad koshish karein.";
  }
};

export const getSpeech = async (text: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
        },
      },
    });
    
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return base64Audio;
    }
    return null;
  } catch (error) {
    console.error("Error generating speech:", error);
    return null;
  }
};
