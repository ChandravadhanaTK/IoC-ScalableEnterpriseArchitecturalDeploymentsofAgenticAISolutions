// Import React hooks for state management, side effects, and DOM references
import React, { useState, useEffect, useRef } from 'react';
// Import custom components for chat functionality
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import AllConversations from './AllConversations';
import DocumentPanel from './DocumentPanel';
// Import TypeScript types for type safety
import { Message, FullConversation } from '../types';
// Import API functions to communicate with the backend
import { api } from '../api';

// User interface
interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

// Component props interface
interface ChatBotProps {
  currentUser: User;
  onLogout: () => void;
}

/**
 * ChatBot Component - Main chat interface component
 * 
 * This component manages:
 * - Chat messages state and display
 * - Conversation selection and creation
 * - Real-time messaging with backend API
 * - Auto-scrolling to latest messages
 * - Loading states and error handling
 * - User info and logout functionality
 * 
 * The component uses React.FC (FunctionComponent) type for TypeScript type safety
 */
const ChatBot: React.FC<ChatBotProps> = ({ currentUser, onLogout }) => {
  // STATE MANAGEMENT
  
  // Array of messages in the current conversation
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Loading state for when sending messages to backend
  const [isLoading, setIsLoading] = useState(false);
  
  // Current active conversation ID (null for new conversations)
  const [conversationId, setConversationId] = useState<number | null>(null);
  
  // Typing indicator state to show when assistant is "thinking"
  const [isTyping, setIsTyping] = useState(false);
  
  // Trigger to refresh conversation list when new conversation is created
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Sidebar width state for resizable functionality
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('sidebarWidth');
    return saved ? parseInt(saved, 10) : 350;
  });
  
  // Resize state
  const [isResizing, setIsResizing] = useState(false);
  
  // Reference to the bottom of messages container for auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * Auto-scroll to bottom of messages container
   * Provides smooth scrolling behavior for better UX
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * Effect hook to auto-scroll when messages change or typing indicator appears
   * Dependencies: [messages, isTyping] - runs when either changes
   */
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  /**
   * Handle conversation selection from sidebar
   * @param fullConversation - Contains conversation metadata and all messages
   */
  const handleSelectConversation = (fullConversation: FullConversation) => {
    // Set the active conversation ID
    setConversationId(fullConversation.conversation.id);
    // Load all messages from selected conversation
    setMessages(fullConversation.messages);
  };

  /**
   * Handle conversation deletion from sidebar
   * @param deletedConversationId - ID of the conversation being deleted
   */
  const handleDeleteConversation = (deletedConversationId: number) => {
    // If the deleted conversation is currently active, clear the chat interface
    if (conversationId === deletedConversationId) {
      setMessages([]);
      setConversationId(null);
    }
  };

  /**
   * Handle sending a new message to the AI assistant
   * @param messageContent - The user's message text
   */
  const handleSendMessage = async (messageContent: string) => {
    // Prevent sending empty messages
    if (!messageContent.trim()) return;

    // Create user message object and add to UI immediately for responsive feel
    const userMessage: Message = {
      role: 'user',
      content: messageContent,
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Set loading states
    setIsLoading(true);
    setIsTyping(true);

    const isNewConversation = !conversationId;

    try {
      // Send message to backend API
      const response = await api.sendMessage({
        message: messageContent,
        conversation_id: conversationId || undefined, // undefined for new conversations
      });

      // If this is a new conversation, update the conversation ID
      if (!conversationId) {
        setConversationId(response.conversation_id);
        // Refresh conversation list after a delay to show new conversation
        setTimeout(() => {
          setRefreshTrigger(prev => prev + 1);
        }, 500);
      }

      // Create assistant message object and add to UI
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.response,
        conversation_id: response.conversation_id,
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      // Log error for debugging
      console.error('Error sending message:', error);
      
      // Show user-friendly error message
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      // Always clear loading states
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  /**
   * Start a new conversation by clearing current state
   */
  const handleNewConversation = () => {
    setMessages([]);
    setConversationId(null);
  };

  /**
   * Handle mouse down on resize handle
   */
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  /**
   * Handle double-click to reset sidebar width
   */
  const handleDoubleClick = () => {
    setSidebarWidth(350); // Reset to default width
  };

  /**
   * Handle keyboard navigation for resizing
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const newWidth = Math.max(250, sidebarWidth - 10);
      setSidebarWidth(newWidth);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const newWidth = Math.min(600, sidebarWidth + 10);
      setSidebarWidth(newWidth);
    }
  };

  /**
   * Handle mouse move for resizing
   */
  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;
    
    const newWidth = e.clientX;
    const minWidth = 250;
    const maxWidth = Math.min(600, window.innerWidth * 0.6); // Max 60% of screen width
    
    // Clamp the width within bounds
    const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
    
    if (clampedWidth !== sidebarWidth) {
      setSidebarWidth(clampedWidth);
    }
  };

  /**
   * Handle mouse up to stop resizing
   */
  const handleMouseUp = () => {
    setIsResizing(false);
  };

  // Add event listeners for mouse move and mouse up
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  // Save sidebar width to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('sidebarWidth', sidebarWidth.toString());
  }, [sidebarWidth]);

  // RENDER UI
  return (
    // whole app
    <div className="app-container">
      {/* LEFT SIDEBAR - Conversation History */}
      <div 
        className="conversations-sidebar" 
        style={{ width: `${sidebarWidth}px` }}
      >
        {/* Sidebar Header with title and new conversation button */}
        <div className="sidebar-header">
          <h3>💬 Conversations</h3>
          <button
            onClick={handleNewConversation}
            className="new-chat-button-sidebar"
            title="Start a new conversation"
          >
            ➕ New
          </button>
        </div>
        
        {/* Container for conversation list component */}
        <div className="conversations-list-container">
          <AllConversations
            onSelectConversation={handleSelectConversation}
            onDeleteConversation={handleDeleteConversation}
            currentConversationId={conversationId || undefined}
            refreshTrigger={refreshTrigger}
          />
        </div>

        {/* Document upload panel for RAG */}
        <DocumentPanel />
      </div>

      {/* RESIZE HANDLE */}
      <div 
        className="resize-handle"
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
        title="Drag to resize sidebar, double-click to reset, or use arrow keys"
        role="separator"
        aria-label="Resize sidebar"
        aria-orientation="vertical"
        tabIndex={0}
      />

      {/* RIGHT MAIN AREA - Chat Interface */}
      <div className="chat-container">
        {/* Chat Header */}
        <div className="chat-header">
          <h1 className="chat-title">✨ AI Assistant</h1>
          <div className="user-info">
            <span className="welcome-text">Welcome, {currentUser.username}!</span>
            <button 
              className="logout-button"
              onClick={onLogout}
              aria-label="Logout"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Messages Display Area */}
        <div className="messages-container">
        {/* Conditional rendering: Welcome message for empty chat, messages for active chat */}
        {messages.length === 0 ? (
          // Welcome screen for new conversations
          <div className="welcome-message">
            <div className="welcome-content">
              <h2>
                Welcome to AI Assistant
              </h2>
              <p>
                I'm here to help you with questions, creative writing, problem-solving, and much more. 
                Start a conversation by typing a message below!
              </p>
              <p className="welcome-note">
                💡 All your conversations are automatically saved. Use the conversation history in the left sidebar to revisit previous chats.
              </p>
            </div>
          </div>
        ) : (
          // Active conversation display
          <>
            {/* Render each message as a MessageBubble component */}
            {messages.map((message, index) => (
              <MessageBubble key={index} message={message} />
            ))}
            {/* Show typing indicator when assistant is responding */}
            <TypingIndicator isVisible={isTyping} />
          </>
        )}
        {/* Invisible element used for auto-scrolling to bottom */}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Area */}
      <div className="input-area">
        <MessageInput 
          onSendMessage={handleSendMessage} 
          isLoading={isLoading} // Disables input while sending
        />
      </div>
    </div>
    </div>
  );
};

export default ChatBot;
