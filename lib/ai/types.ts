// Defines the shape of a single message in the conversation history
// "user" = message sent by the human, "assistant" = message sent by Claude
// content is the actual text of the message
export type ChatMessage = {
  role: "user" | "assistant"
  content: string
}
