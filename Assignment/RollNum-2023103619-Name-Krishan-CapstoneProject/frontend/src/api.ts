/**
 * api.ts
 *
 * This module provides a typed API client for interacting with the FastAPI backend.
 * It defines all HTTP requests used by the frontend to manage chat conversations,
 * send/receive messages, and perform CRUD operations on conversations.
 *
 * Key Features:
 * - Centralized API endpoint management
 * - TypeScript type safety for all request/response payloads
 * - Consistent error handling for failed requests
 * - Easy to extend for new endpoints
 *
 * API Methods:
 * - sendMessage: Send a chat message and receive a response
 * - getConversationMessages: Fetch all messages for a conversation
 * - createConversation: Start a new conversation for a user
 * - getUserConversations: List all conversations for a user
 * - getFullConversation: Fetch a conversation with all messages and metadata
 * - deleteConversation: Remove a conversation and all its messages
 *
 * Usage:
 *   import { chatAPI } from './api';
 *   const response = await chatAPI.sendMessage({ ... });
 *
 * All methods return Promises and throw errors on network or server failure.
 */

import { ChatRequest, ChatResponse, Message, ConversationSummary, FullConversation, Document } from './types';

// Authentication types
interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

interface LoginRequest {
  username: string;
  password: string;
}

interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

const API_BASE_URL = process.env.REACT_APP_API_URL ?? 'http://localhost:8000';

/**
 * Gets the authorization headers with JWT token
 * 
 * @returns Object containing authorization headers if token exists
 */
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('authToken');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const api = {
  // Authentication endpoints
  
  /**
   * Registers a new user account
   * 
   * @param userData - User registration data
   * @returns Promise resolving to User object
   */
  async register(userData: RegisterRequest): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Registration failed');
    }

    return response.json();
  },

  /**
   * Logs in a user and returns authentication token
   * 
   * @param credentials - User login credentials
   * @returns Promise resolving to login response with token and user data
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Login failed');
    }

    return response.json();
  },

  /**
   * Gets current user information from JWT token
   * 
   * @returns Promise resolving to current user data
   */
  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    return response.json();
  },

  // Chat endpoints (updated to use authentication)
  /**
   * Sends a chat message to the backend API and returns the response.
   *
   * @param request - The chat request payload containing the message and any additional metadata required by the backend.
   * @returns A promise that resolves to a {@link ChatResponse} object containing the response from the backend.
   * @throws {Error} Throws an error if the network request fails or the response status is not OK.
   */
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    return response.json();
  },

  /**
   * Retrieves all messages for a given conversation by its ID.
   *
   * @param conversationId - The unique identifier of the conversation to fetch messages from.
   * @returns A promise that resolves to an array of `Message` objects belonging to the specified conversation.
   * @throws Will throw an error if the network request fails or the response is not OK.
   */
  async getConversationMessages(conversationId: number): Promise<Message[]> {
    const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/messages`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }

    return response.json();
  },

  /**
   * Creates a new conversation for the specified user.
   *
   * Sends a POST request to the backend API to create a conversation associated with the given user ID.
   *
   * @param userId - The unique identifier of the user for whom the conversation is being created.
   * @returns A promise that resolves to an object containing the conversation's `id` and the associated `user_id`.
   * @throws Will throw an error if the conversation creation fails (i.e., the response is not OK).
   */
  async createConversation(userId: string): Promise<{ id: number; user_id: string }> {
    const response = await fetch(`${API_BASE_URL}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
      throw new Error('Failed to create conversation');
    }

    return response.json();
  },

  /**
   * Gets all conversations for the authenticated user
   * 
   * @returns Promise resolving to array of conversation summaries
   */
  async getUserConversations(): Promise<ConversationSummary[]> {
    const response = await fetch(`${API_BASE_URL}/conversations`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user conversations');
    }

    return response.json();
  },

  /**
   * Gets full conversation details including all messages
   * 
   * @param conversationId - ID of the conversation to fetch
   * @returns Promise resolving to full conversation data
   */
  async getFullConversation(conversationId: number): Promise<FullConversation> {
    const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/full`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch full conversation');
    }

    return response.json();
  },

  /**
   * Retrieves the full conversation details for a given conversation ID.
   *
   * @param conversationId - The unique identifier of the conversation to fetch.
  /**
   * Deletes a conversation and all its messages by conversation ID.
   *
   * @param conversationId - The unique identifier of the conversation to delete.
   * @returns A promise that resolves to an object containing a confirmation message and the deleted conversation's ID.
   * @throws {Error} If the network request fails or the response is not OK.
   */
  async deleteConversation(conversationId: number): Promise<{ message: string; conversation_id: number }> {
    const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete conversation');
    }

    return response.json();
  },

  // Document / RAG endpoints

  async uploadDocument(file: File, isGlobal: boolean): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('is_global', String(isGlobal));

    const response = await fetch(`${API_BASE_URL}/documents/upload`, {
      method: 'POST',
      headers: { ...getAuthHeaders() },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'Failed to upload document');
    }

    return response.json();
  },

  async getDocuments(): Promise<Document[]> {
    const response = await fetch(`${API_BASE_URL}/documents`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch documents');
    }

    return response.json();
  },

  async addUrlDocument(url: string, isGlobal: boolean): Promise<Document> {
    const response = await fetch(`${API_BASE_URL}/documents/upload-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ url, is_global: isGlobal }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'Failed to ingest URL');
    }

    return response.json();
  },

  async deleteDocument(docId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/documents/${docId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'Failed to delete document');
    }
  },
};
