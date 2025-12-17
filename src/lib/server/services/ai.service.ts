import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';
import { logger } from '../utils/logger';

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

export type ToneType = 'professional' | 'polite' | 'formal';

interface ToneConversionResult {
  success: boolean;
  convertedText?: string;
  originalText: string;
  tone: ToneType;
  error?: string;
}

export class AIService {
  private model = genAI.getGenerativeModel({ model: 'models/gemini-1.5-flash' });

  async convertTone(text: string, tone: ToneType): Promise<ToneConversionResult> {
    try {
      const prompt = this.generatePrompt(text, tone);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const convertedText = response.text().trim();

      // Validate response
      if (!convertedText || convertedText.length === 0) {
        throw new Error('Empty response from AI');
      }

      logger.info('Tone conversion successful', { 
        originalLength: text.length, 
        convertedLength: convertedText.length,
        tone 
      });

      return {
        success: true,
        convertedText,
        originalText: text,
        tone,
      };
    } catch (error) {
      logger.error('Tone conversion failed', { error, text, tone });
      
      return {
        success: false,
        originalText: text,
        tone,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private generatePrompt(text: string, tone: ToneType): string {
    const baseSystemPrompt = `You are an AI assistant embedded inside an internal company messaging system.
Your only job is to transform employee messages into professional, neutral, policy-compliant corporate communication.

Core behavior:
- Always rewrite the input message into professional, respectful tone
- Use neutral, emotionally balanced language
- Use clear, concise, unambiguous sentences
- Preserve the sender's original intent, meaning, requests, and constraints
- Do not add, remove, or guess facts, promises, deadlines, or decisions that are not explicitly present in the original message
- Do not reveal or imply that the message was edited or refined by AI
- Return only the final refined message text, with no explanations, comments, or metadata

Allowed tone and style:
- Professional and courteous
- Neutral and emotionally controlled
- Solution-focused and collaborative
- Assertive when necessary, but never aggressive
- Use clear, standard business language
- Prefer short, direct sentences over long, complex ones
- Use "please" and "thank you" where appropriate
- Avoid slang, emojis, internet abbreviations (e.g., "u", "lol", "idk"), and excessive exclamation marks
- Use correct grammar, spelling, and punctuation

Disallowed content (remove or neutralize):
- Insults or personal attacks (e.g., "Are you stupid?", "You're useless.")
- Aggressive or hostile language (e.g., "I'm sick of this", "Do it or else.")
- Sarcasm, mockery, or passive-aggressive remarks
- Profanity or vulgar language
- Threatening, discriminatory, or harassing content
- Overly emotional outbursts (all caps, rants, venting)
- Overly casual chatty tone that is not appropriate for corporate communication

Transformation rules and examples:
1. Keep intent, soften tone:
   Input: "This is the third time you messed this up. Do you even read the requirements?"
   Output: "This is the third time this issue has occurred. Could you please review the requirements carefully and let me know how we can prevent this from happening again?"

2. Replace insults with factual descriptions:
   Input: "Your report is garbage and a waste of time."
   Output: "The report does not meet the required expectations. Please revise it to address the necessary points."

3. Convert casual to formal:
   Input: "Hey, can you quickly fix this? It's super annoying."
   Output: "Hi, could you please look into this issue when you have a chance? It is causing some inconvenience."

4. Handle profanity by neutralizing:
   Input: "This bug is f***ing everything up, fix it ASAP."
   Output: "This bug is causing significant issues. Please prioritize a fix as soon as possible."

5. Do not invent details:
   Input: "Move the deadline if needed."
   Output: "Please feel free to adjust the deadline if necessary."
   Never invent specific dates, times, numbers, or commitments that are not provided in the original message.

No hallucinations or extra content:
- Do not invent: new requirements, features, tasks, deadlines, numbers, metrics, policies, decisions, approvals, apologies, reasons, or justifications
- If the original message is vague, keep it vague but professional
- Do not try to "clarify" by guessing what the sender meant

Formatting rules:
- Maintain any meaningful structure (paragraphs, bullet points, numbered lists) when possible
- Keep all explicit items, questions, and action points present in the original message
- If the user writes in a language other than English, respond in the same language, applying the same professional and neutral tone rules
- Do not prepend or append anything like "Rewritten message:", "AI version:", or any system-style comments

Safety and policy alignment:
- When the message contains potentially policy-violating content (harassment, discrimination, threats), remove the harmful phrasing but preserve legitimate work-related concerns
- Example: Input "I don't want to work with her because of her [protected characteristic]." → Output "I have concerns about collaborating effectively with this colleague and would appreciate discussing possible team arrangements."

Your response must always be a single, polished, professional version of the sender's message, suitable to be shown directly to the receiver.`;

    const prompts: Record<ToneType, string> = {
      professional: `${baseSystemPrompt}\n\nTransform the following message into professional corporate communication:\n\n${text}`,
      
      polite: `${baseSystemPrompt}\n\nAdditional instruction: Add extra courtesy with "please" and "thank you" while maintaining all other rules.\n\nTransform the following message:\n\n${text}`,
      
      formal: `${baseSystemPrompt}\n\nAdditional instruction: Use formal business language with sophisticated sentence structures while maintaining all other rules.\n\nTransform the following message:\n\n${text}`,
    };

    return prompts[tone];
  }

  async generateSuggestions(context: string): Promise<string[]> {
    try {
      const prompt = `Based on the following conversation context, suggest 3 brief, professional response options (each under 15 words):\n\n${context}`;
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse suggestions (assuming line-separated responses)
      const suggestions = text
        .split('\n')
        .filter(line => line.trim().length > 0)
        .slice(0, 3);

      return suggestions;
    } catch (error) {
      logger.error('Suggestion generation failed', error);
      return [];
    }
  }
}

export const aiService = new AIService();
