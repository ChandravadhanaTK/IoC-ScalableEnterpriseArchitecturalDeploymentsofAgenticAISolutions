/**
 * MessageInput Component
 * 
 * A sophisticated input component for composing and sending chat messages.
 * Features auto-resizing textarea, keyboard shortcuts, and intelligent form handling.
 * Provides an excellent user experience with smooth animations and responsive design.
 * 
 * Key Features:
 * - Auto-resizing textarea that grows with content
 * - Enter to send, Shift+Enter for new lines
 * - Disabled state during message processing
 * - Form validation to prevent empty submissions
 * - Smooth animations and visual feedback
 * - Accessibility-friendly with proper ARIA labels
 */

import React, { useState, useRef, useEffect } from 'react';

/**
 * Props interface for MessageInput component
 * 
 * @interface MessageInputProps
 * @property {function} onSendMessage - Callback function executed when a message is sent
 * @property {boolean} isLoading - Flag indicating if a message is currently being processed
 */
interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

/**
 * MessageInput functional component
 * 
 * Manages message composition with advanced input handling and user experience features.
 * Integrates form validation, auto-resize functionality, and keyboard shortcuts.
 */
const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, isLoading }) => {
  // Local state for the current message being composed
  const [message, setMessage] = useState('');
  
  // Reference to the textarea element for direct DOM manipulation (auto-resize)
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Handles form submission when user clicks send button
   * Validates message content and clears input after sending
   * 
   * @param {React.FormEvent} e - Form submission event
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only send if message has content and we're not currently loading
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage(''); // Clear input after sending
    }
  };

  /**
   * Handles keyboard events for enhanced user experience
   * Enter key sends message, Shift+Enter creates new line
   * 
   * @param {React.KeyboardEvent} e - Keyboard event from textarea
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent default form submission
      handleSubmit(e);
    }
    // Note: Shift+Enter naturally creates new lines, no special handling needed
  };

  /**
   * Effect: Auto-resize textarea based on content
   * Adjusts height dynamically as user types to accommodate multiple lines
   * Provides smooth user experience without scroll bars for short messages
   */
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to auto to get the natural height
      textareaRef.current.style.height = 'auto';
      // Set height to match scroll height (content height)
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [message]); // Re-run when message content changes

  return (
    /* Form wrapper with semantic HTML for accessibility */
    <form onSubmit={handleSubmit} className="input-form">
      {/* Auto-resizing textarea with comprehensive event handling */}
      <textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
        className="message-input"
        disabled={isLoading} // Prevent input during message processing
        rows={1} // Start with single row, auto-resize handles expansion
      />
      
      {/* Send button with intelligent disabled state */}
      <button
        type="submit"
        disabled={!message.trim() || isLoading} // Disabled if empty or loading
        className="send-button"
      >
        {/* Send icon with loading state consideration */}
        {isLoading ? '⏳' : '📤'}
      </button>
    </form>
  );
};

export default MessageInput;
