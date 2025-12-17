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
  private model = genAI.getGenerativeModel({ model: 'gemini-pro' });

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
    const prompts: Record<ToneType, string> = {
      professional: `Rewrite the following message in a professional business tone. Keep the core meaning intact but make it suitable for workplace communication. Only return the rewritten text, nothing else:\n\n${text}`,
      
      polite: `Rewrite the following message in a polite and courteous tone. Add appropriate pleasantries and maintain respectfulness. Only return the rewritten text, nothing else:\n\n${text}`,
      
      formal: `Rewrite the following message in a formal and sophisticated tone. Use proper grammar, complete sentences, and formal language structure. Only return the rewritten text, nothing else:\n\n${text}`,
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
