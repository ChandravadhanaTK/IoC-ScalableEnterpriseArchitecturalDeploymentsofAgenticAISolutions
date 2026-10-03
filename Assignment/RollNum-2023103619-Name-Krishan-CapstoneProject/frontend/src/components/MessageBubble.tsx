// Core React import
import React from 'react';
// ReactMarkdown for rendering Markdown content to JSX
import ReactMarkdown from 'react-markdown';
// Remark plugins for enhanced Markdown parsing
import remarkGfm from 'remark-gfm';      // GitHub Flavored Markdown (tables, strikethrough, etc.)
import remarkMath from 'remark-math';    // LaTeX mathematical expressions
// Rehype plugins for HTML processing
import rehypeKatex from 'rehype-katex';  // Renders LaTeX math using KaTeX
// Syntax highlighting for code blocks
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
// TypeScript types
import { Message } from '../types';

// Import KaTeX CSS for mathematical equation styling
import 'katex/dist/katex.min.css';

/**
 * Props interface for MessageBubble component
 */
interface MessageBubbleProps {
  message: Message; // Message object containing role and content
}

/**
 * MessageBubble Component - Renders individual chat messages
 * 
 * Features:
 * - Markdown rendering with GitHub Flavored Markdown (tables, strikethrough, etc.)
 * - LaTeX math equation rendering using KaTeX
 * - Syntax-highlighted code blocks for multiple programming languages
 * - Different styling for user vs assistant messages
 * - Rich content support (tables, lists, links, images)
 * - Avatar display for assistant messages
 */
const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  // Determine if this is a user message for conditional styling
  const isUser = message.role === 'user';
  
  // Ensure content is always a string to prevent type errors
  const content: string = message.content || '';

  return (
    <div className={`message-bubble ${isUser ? 'user' : 'assistant'}`}>
      {/* Avatar for assistant messages (not shown for user messages) */}
      {!isUser && (
        <div className="message-avatar assistant-avatar">
          🤖
        </div>
      )}
      
      {/* Message content container with role-based styling */}
      <div className={`message-content ${isUser ? 'user' : 'assistant'}`}>
        <div className="markdown-content">
          {/* ReactMarkdown component with enhanced features */}
          <ReactMarkdown 
            // Remark plugins for enhanced Markdown parsing
            remarkPlugins={[
              remarkGfm,  // GitHub Flavored Markdown (tables, task lists, strikethrough)
              remarkMath, // Mathematical expressions in LaTeX syntax
            ]}
            // Rehype plugins for HTML processing
            rehypePlugins={[
              rehypeKatex, // Renders LaTeX math expressions using KaTeX
            ]}
            skipHtml={false} // Allow HTML tags in markdown
            children={content} // Explicitly pass content as children prop
            components={{
              /**
               * Custom code block renderer with syntax highlighting
               * Handles both inline code and multi-line code blocks
               * @param props - Contains className, children, and other attributes
               */
              code(props: any) {
                const { node, inline, className, children, ...rest } = props;
                // Extract language from className (format: "language-javascript")
                const match = /language-(\w+)/.exec(className || '');
                const language = match ? match[1] : '';
                
                // Render multi-line code blocks with syntax highlighting
                return !inline && language ? (
                  <SyntaxHighlighter
                    style={isUser ? oneDark as any : oneLight as any} // Different themes for user/assistant
                    language={language}
                    PreTag="div"
                    className="code-block"
                    customStyle={{
                      margin: '12px 0',
                      borderRadius: '8px',
                      fontSize: '0.9em',
                    }}
                    {...rest}
                  >
                    {String(children).replace(/\n$/, '')} {/* Remove trailing newline */}
                  </SyntaxHighlighter>
                ) : (
                  // Render inline code with simple styling
                  <code className={`inline-code ${className || ''}`} {...rest}>
                    {children}
                  </code>
                );
              },
            }}
          />
        </div>
      </div>
      
      {/* Avatar for user messages (shown on right side) */}
      {isUser && (
        <div className="message-avatar user-avatar">
          👤
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
