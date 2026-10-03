/**
 * TypeScript Type Definitions for Chatbot Application
 * 
 * This file contains all the shared type definitions used throughout
 * the frontend application for type safety and IntelliSense support.
 * 
 * These types should match the Pydantic models in the backend
 * to ensure API compatibility.
 */

/**
 * Message interface representing individual chat messages
 * 
 * Used for both user messages and AI assistant responses
 * Corresponds to the Message Pydantic model in the backend
 */
export interface Message {
  id?: number;                    // Optional: Database ID (not present for new messages)
  role: 'user' | 'assistant';    // Type of message sender - strictly typed union
  content: string;               // The actual message text content
  conversation_id?: number;       // Optional: ID of parent conversation
  created_at?: string;           // Optional: ISO timestamp string from database (legacy)
  timestamp?: string;            // Optional: ISO timestamp string from database
}

/**
 * ChatRequest interface for sending messages to the backend
 * 
 * Represents the payload structure for POST /chat API endpoint
 * Corresponds to the ChatRequest Pydantic model in the backend
 * User authentication is handled via JWT token in headers
 */
export interface ChatRequest {
  message: string;                     // The user's message content
  conversation_id?: number;            // Optional: ID of existing conversation (undefined for new)
}

/**
 * ChatResponse interface for responses from the backend
 * 
 * Represents the response structure from POST /chat API endpoint
 * Corresponds to the ChatResponse Pydantic model in the backend
 */
export interface ChatResponse {
  response: string;                    // The AI assistant's response message
  conversation_id: number;             // ID of the conversation this message belongs to
}

/**
 * Conversation interface representing conversation metadata
 * 
 * Contains basic information about a conversation without the actual messages
 * Used for conversation listings and basic operations
 */
export interface Conversation {
  id: number;                    // Unique conversation identifier from database
  user_id: string;              // ID of the user who owns this conversation
  created_at: string;           // ISO timestamp when conversation was created
}

/**
 * ConversationSummary interface for enhanced conversation listings
 * 
 * Provides additional metadata for conversation previews in the sidebar
 * Includes message statistics and preview content for better UX
 */
export interface ConversationSummary {
  id: number;                    // Unique conversation identifier
  user_id: string;              // Owner of the conversation
  created_at: string;           // When conversation was started
  message_count: number;        // Total number of messages in conversation
  last_message_at: string | null;  // Timestamp of most recent message (null if no messages)
  preview: string;              // Preview text from first/last message for display
}

/**
 * FullConversation interface representing complete conversation data
 * 
 * Combines conversation metadata with all associated messages
 * Used when loading conversation history from the backend
 * Corresponds to the FullConversation Pydantic model in the backend
 */
export interface Document {
  id: number;
  user_id: number;
  filename: string;
  file_type: string;
  chunk_count: number;
  is_global: boolean | number;
  created_at: string;
}

export interface FullConversation {
  conversation: {
    id: number;                  // Conversation unique identifier
    user_id: string;            // Owner of the conversation
    created_at: string;         // Creation timestamp
  };
  messages: Message[];          // Array of all messages in chronological order
}
