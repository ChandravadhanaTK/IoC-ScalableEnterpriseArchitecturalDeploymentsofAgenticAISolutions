/**
 * TypingIndicator Component
 * 
 * A visual indicator that shows when the AI assistant is processing and typing a response.
 * Mimics the appearance of a regular message bubble but contains animated dots instead of text.
 * Provides immediate feedback to users that their message was received and is being processed.
 * 
 * Key Features:
 * - Conditional rendering based on visibility prop
 * - Styled to match assistant message bubbles for consistency
 * - Animated dots with smooth pulsing effect
 * - Robot emoji avatar for clear AI identification
 * - Seamless integration with the chat message flow
 */

import React from 'react';

/**
 * Props interface for TypingIndicator component
 * 
 * @interface TypingIndicatorProps
 * @property {boolean} isVisible - Controls whether the typing indicator is displayed
 */
interface TypingIndicatorProps {
  isVisible: boolean;
}

/**
 * TypingIndicator functional component
 * 
 * Renders a message bubble with animated typing dots when the AI is processing.
 * Returns null when not visible to avoid unnecessary DOM elements and improve performance.
 */
const TypingIndicator: React.FC<TypingIndicatorProps> = ({ isVisible }) => {
  // Early return for performance - don't render anything when not visible
  if (!isVisible) return null;

  return (
    /* Message bubble container styled to match assistant messages */
    <div className="message-bubble assistant">
      {/* Avatar section with robot emoji for AI identification */}
      <div className="message-avatar assistant-avatar">
        🤖
      </div>
      
      {/* Content area containing the animated typing indicator */}
      <div className="message-content assistant">
        {/* Animated dots indicating active typing/processing */}
        <div className="typing-indicator">
          {/* Three spans that animate in sequence for typing effect */}
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
