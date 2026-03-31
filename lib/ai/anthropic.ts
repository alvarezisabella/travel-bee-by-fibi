import Anthropic from "@anthropic-ai/sdk"

// Singleton anthropic client instance
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})
