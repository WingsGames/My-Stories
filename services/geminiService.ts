

import { GoogleGenAI, Type, Modality } from "@google/genai";
import { StoryPage, Language } from "@/types";

// Initialize Gemini Client
// @ts-ignore
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates the story text split into pages using JSON schema, and a style guide for illustrations.
 */
export const generateStoryText = async (
  topic: string,
  age: number,
  pages: number,
  numIllustrations: number,
  language: Language
): Promise<{ title: string; pages: Omit<StoryPage, 'imageData' | 'audioData'>[], styleGuide: string }> => {
  
  const langPrompt = language === Language.HEBREW ? "Hebrew" : "English";
  
  const prompt = `Write a creative children's story for a ${age}-year-old child about "${topic}". 
  The story must be written in ${langPrompt}.
  The story should have exactly ${pages} distinct parts (pages).

  First, create a consistent visual style guide. Describe the main characters (e.g., "a small, curious fox with a fluffy tail and bright blue eyes named Felix") and the overall art style (e.g., "A whimsical, watercolor style with soft pastel colors and gentle lines"). This guide will be used for all illustrations.
  
  Then, write the story. I need exactly ${numIllustrations} illustrations for this story. 
  Assign visual descriptions (image prompts) to the ${numIllustrations} most key scenes. 
  For pages that should NOT have an illustration, return an empty string or null for the 'imagePrompt'.
  
  The image prompts should be in English, detailed, and describe the scene vividly. They must reference the characters you defined.
  Provide a catchy title for the story.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "The title of the story" },
          styleGuide: { type: Type.STRING, description: "A description of the main characters and visual art style to ensure consistency across all illustrations." },
          pages: {
            type: Type.ARRAY,
            description: "The pages of the story",
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING, description: "The story text for this page" },
                imagePrompt: { type: Type.STRING, description: "A visual description for the AI image generator, or empty string if no image for this page", nullable: true }
              },
              required: ["text"]
            }
          }
        },
        required: ["title", "styleGuide", "pages"]
      }
    }
  });

  const json = JSON.parse(response.text || "{}");
  return json;
};

/**
 * Generates an image for a specific page using the prompt and a style guide for consistency.
 */
export const generateIllustration = async (prompt: string, styleGuide: string): Promise<string> => {
  if (!prompt || prompt.trim() === "") return "";

  try {
    const enhancedPrompt = `Style Guide: ${styleGuide}. Based on that style, create a children's book illustration for the following scene: ${prompt}. The image must not contain any text or words. Purely visual art.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      // FIX: Per image generation guidelines, text prompts should be wrapped in the `parts` array.
      contents: { parts: [{ text: enhancedPrompt }] }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData && part.inlineData.data) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data returned");
  } catch (error) {
    console.error("Image generation failed:", error);
    return `https://picsum.photos/800/600?blur=2`; 
  }
};

/**
 * Generates speech audio for a text segment.
 */
export const generateSpeech = async (text: string, language: Language): Promise<string | null> => {
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
    return base64Audio || null;
  } catch (error) {
    console.error("TTS generation failed:", error);
    return null;
  }
};