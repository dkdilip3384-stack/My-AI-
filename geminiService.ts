
import { GoogleGenAI } from "@google/genai";
import { ChatMessage, CodeSnippet } from "../types.ts";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const codingAssistant = async (
  prompt: string,
  history: ChatMessage[],
  coreModel: string = 'NEXUS'
): Promise<{ text: string; snippets: CodeSnippet[] }> => {
  
  // 1. CONTEXT BUILDER: Convert ChatMessage[] to Gemini Content format
  // This gives the AI "Memory" of the conversation.
  const pastTurns = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  // Add the current prompt to the sequence
  const currentContent = {
    role: 'user',
    parts: [{ text: `User Command: ${prompt}` }]
  };

  const fullConversation = [...pastTurns, currentContent];

  // 2. CORE CONFIGURATION
  let modelName = "gemini-3-flash-preview"; 
  let thinkingBudget = 0; // Default: No thinking (Instant speed)
  let temperature = 0.7;
  let modeInstruction = "";

  if (coreModel === 'TITAN') {
      // TITAN: Uses Gemini 3 Pro with 'Thinking' enabled.
      // It will "Reason" before answering, just like a human engineer.
      modelName = "gemini-3-pro-preview"; 
      thinkingBudget = 2048; // Allocate token budget for reasoning
      temperature = 0.7; 
      modeInstruction = `
      MODE: TITAN-X (DEEP REASONING). 
      You are a Senior Principal Software Engineer. 
      Before writing code, THINK about the architecture, edge cases, and state management.
      Create robust, bug-free, production-grade applications.
      `;
  } else if (coreModel === 'QUANTUM') {
      // QUANTUM: High creativity, experimental
      modelName = "gemini-3-pro-preview";
      temperature = 1.4; // High temperature for wild creativity
      modeInstruction = `
      MODE: QUANTUM-Z (EXPERIMENTAL).
      You are a Creative Technologist from the year 3000.
      Prioritize visual impact, particles, 3D (Three.js), and glassmorphism.
      Break standard UI rules to create something breathtaking.
      `;
  } else {
      // NEXUS: Fast, efficient
      modelName = "gemini-3-flash-preview";
      modeInstruction = "MODE: NEXUS-7 (SPEED). Instant prototyping. Fast, clean, and efficient.";
  }

  const systemInstruction = `
  You are V6000 NEXUS, an Autonomous AI Coding Engine.
  ${modeInstruction}

  CRITICAL CODING STANDARDS (YOU MUST FOLLOW THESE):
  1.  **SINGLE FILE ARCHITECTURE:** Generate a single HTML file containing CSS (<style>) and JS (<script type="module">).
  2.  **MODERN STACK:** Use React 19, Tailwind CSS, and Lucide Icons via CDN/ESM.
      - React: https://esm.sh/react@19.2.3
      - ReactDOM: https://esm.sh/react-dom@19.2.3
      - Lucide: https://esm.sh/lucide-react@0.562.0
  3.  **MOBILE-NATIVE PWA (CRITICAL):** 
      - Add <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      - Add <meta name="apple-mobile-web-app-capable" content="yes">
      - Add <meta name="mobile-web-app-capable" content="yes">
      - Ensure the app takes up 100% height and looks like a native app (no scrollbars on body).
  4.  **NO PLACEHOLDERS:** Never say "// logic here". Write the FULL working code.
  5.  **ERROR CORRECTION:** If the user asks to "fix" or "change" something, analyze the history to understand what code they are referring to.

  OUTPUT FORMAT:
  Wrap your code strictly in \`\`\`html \`\`\` blocks.
  Explain your logic briefly before or after the code.
  `;

  const processResponse = (rawText: string) => {
    const snippets: CodeSnippet[] = [];
    let cleanText = rawText;

    if (rawText.includes("```html")) {
      const match = rawText.match(/```html([\s\S]*?)```/);
      if (match) {
        snippets.push({ 
          language: 'html', 
          code: match[1].trim(), 
          filename: 'nexus_result.html',
          isRunnable: true 
        });
        cleanText = cleanText.replace(match[0], "\n✨ [CODE MATERIALIZED] ✨\n");
      }
    }
    return { text: cleanText, snippets };
  };

  try {
    console.log(`Engaging ${coreModel} Core (${modelName}) with Budget: ${thinkingBudget}`);
    
    // Prepare Config
    const config: any = {
        systemInstruction,
        temperature,
        tools: [{ googleSearch: {} }] // Always search for latest docs
    };

    // Apply Thinking Config only for TITAN (Gemini 3 Pro)
    if (coreModel === 'TITAN' && thinkingBudget > 0) {
        config.thinkingConfig = { thinkingBudget };
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: fullConversation, // SEND FULL HISTORY
      config: config
    });
    
    return processResponse(response.text || "Output generated.");

  } catch (error) {
    console.error("Core Processing Error:", error);
    return {
        text: `⚠️ NEURAL OVERLOAD in ${coreModel}. Retrying with Safe Mode...`,
        snippets: []
    };
  }
};
