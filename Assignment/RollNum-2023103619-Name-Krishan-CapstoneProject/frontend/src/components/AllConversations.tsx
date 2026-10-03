/**
 * AllConversations Component
 * 
 * This component displays a sidebar list of all conversations for a specific user.
 * It provides functionality to select, delete, and auto-refresh conversations.
 * The component manages its own state for loading, error handling, and deletion confirmations.
 * 
 * Key Features:
 * - Displays conversation list with titles and timestamps
 * - Auto-refreshes every 30 seconds
 * - Handles conversation selection and deletion
 * - Shows loading states and error messages
 * - Responsive design with highlighting for active conversation
 */

import React, { useState, useEffect } from 'react';
import { ConversationSummary, FullConversation } from '../types';
import { api } from '../api';
import ConfirmDialog from './ConfirmDialog';

/**
 * Props interface for AllConversations component
 * 
 * @interface AllConversationsProps
 * @property {function} onSelectConversation - Callback function when a conversation is selected
 * @property {function} [onDeleteConversation] - Optional callback when a conversation is deleted
 * @property {number} [currentConversationId] - ID of the currently active conversation for highlighting
 * @property {number} [refreshTrigger] - Trigger value to force refresh when new conversation is created
 */
interface AllConversationsProps {
  onSelectConversation: (conversation: FullConversation) => void;
  onDeleteConversation?: (conversationId: number) => void;
  currentConversationId?: number;
  refreshTrigger?: number;
}

/**
 * AllConversations functional component
 * 
 * Manages the display and interaction of all user conversations in a sidebar format.
 * Implements auto-refresh functionality and handles conversation lifecycle operations.
 * Uses authentication to fetch conversations for the current user.
 */
const AllConversations: React.FC<AllConversationsProps> = ({
  onSelectConversation,
  onDeleteConversation,
  currentConversationId,
  refreshTrigger
}) => {
  // State management for conversations list and UI states
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  /**
   * State variable indicating whether the conversations are currently loading.
   */
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<number | null>(null);

  /**
   * Effect: Load conversations when component mounts
   * This ensures that conversations are loaded immediately when the component is rendered
   */
  useEffect(() => {
    loadConversations();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Effect: Refresh conversations when refreshTrigger changes
   * This is used to refresh the list when a new conversation is created from the parent component
   */
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      loadConversations();
    }
  }, [refreshTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Effect: Set up auto-refresh interval
   * Automatically refreshes the conversation list every 30 seconds to keep it up-to-date
   * This ensures users see new conversations or updates without manual refresh
   */
  useEffect(() => {
    const interval = setInterval(() => {
      loadConversations(true); // Pass true for auto-refresh
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Loads conversations from the API
   * 
   * @param {boolean} isAutoRefresh - Flag to indicate if this is an automatic refresh
   *                                  When true, shows a subtle loading indicator instead of full loading state
   */
  const loadConversations = async (isAutoRefresh = false) => {
    if (isAutoRefresh) {
      setIsAutoRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    
    try {
      const conversationList = await api.getUserConversations();
      setConversations(conversationList);
    } catch (error) {
      console.error('Error loading conversations:', error);
      // Only show error message for manual loads, not auto-refresh
      if (!isAutoRefresh) {
        setError('Failed to load conversations');
      }
    } finally {
      if (isAutoRefresh) {
        setIsAutoRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  };

  /**
   * Handles conversation selection when user clicks on a conversation item
   * Fetches the full conversation data including all messages and passes it to parent component
   * 
   * @param {number} conversationId - The ID of the conversation to load
   */
  const handleConversationClick = async (conversationId: number) => {
    try {
      const fullConversation = await api.getFullConversation(conversationId);
      onSelectConversation(fullConversation);
    } catch (error) {
      console.error('Error loading conversation:', error);
      setError('Failed to load conversation');
    }
  };

  /**
   * Initiates the conversation deletion process
   * Shows a confirmation dialog before proceeding with deletion
   * 
   * @param {React.MouseEvent} e - Mouse event to prevent event bubbling
   * @param {number} conversationId - The ID of the conversation to delete
   */
  const handleDeleteClick = (e: React.MouseEvent, conversationId: number) => {
    e.stopPropagation(); // Prevent conversation selection when clicking delete
    setConversationToDelete(conversationId);
    setShowDeleteConfirm(true);
  };

  /**
   * Confirms and executes conversation deletion
   * Removes the conversation from the API and updates local state
   */
  const confirmDelete = async () => {
    if (conversationToDelete === null) return;

    try {
      await api.deleteConversation(conversationToDelete);
      
      // Update local state to remove the deleted conversation
      setConversations(prev => 
        prev.filter(conv => conv.id !== conversationToDelete)
      );
      
      // Notify parent component if callback is provided
      if (onDeleteConversation) {
        onDeleteConversation(conversationToDelete);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      setError('Failed to delete conversation');
    } finally {
      setShowDeleteConfirm(false);
      setConversationToDelete(null);
    }
  };

  /**
   * Cancels the deletion process and closes the confirmation dialog
   */
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setConversationToDelete(null);
  };

  /**
   * Formats a date string into a more readable format
   * Shows relative time (today, yesterday) or formatted date for older conversations
   * 
   * @param {string} dateString - ISO date string from the API
   * @returns {string} Formatted date string for display
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  // Remove the existing render section and replace with commented version
  /**
   * Component render method
   * 
   * Renders the conversations sidebar with:
   * - Auto-refresh indicator (subtle dot when refreshing in background)
   * - Loading state with spinner for initial loads
   * - Error state with retry button
   * - List of conversations with click handlers and delete buttons
   * - Confirmation dialog for deletions
   */
  return (
    <div className="conversations-sidebar-panel">
      {/* Auto-refresh indicator - shows a subtle dot when refreshing in background */}
      {isAutoRefreshing && (
        <div className="auto-refresh-indicator">
          <div className="auto-refresh-dot"></div>
        </div>
      )}
      
      {/* Loading state - shown during initial load or manual refresh */}
      {isLoading && (
        <div className="conversations-loading">
          <div className="loading-spinner">Loading...</div>
        </div>
      )}

      {/* Error state - displays error message with retry option */}
      {error && (
        <div className="conversations-error">
          <p>{error}</p>
          <button onClick={() => loadConversations()} className="retry-button">
            Try Again
          </button>
        </div>
      )}

      {/* Empty state when no conversations exist */}
      {!isLoading && !error && conversations.length === 0 && (
        <div className="no-conversations">
          <p>No conversations yet</p>
        </div>
      )}

      {/* Conversations list - main content area with conversation items */}
      {!isLoading && !error && conversations.length > 0 && (
        <div className="conversations-list">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`conversation-item ${
                currentConversationId === conversation.id ? 'active' : ''
              }`}
              onClick={() => handleConversationClick(conversation.id)}
            >
              {/* Conversation preview with text and metadata */}
              <div className="conversation-preview">
                <div className="conversation-text">
                  {conversation.preview}
                </div>
                <div className="conversation-meta">
                  <span className="message-count">
                    💬 {conversation.message_count}
                  </span>
                  <span className="conversation-date">
                    {formatDate(conversation.last_message_at || conversation.created_at)}
                  </span>
                </div>
              </div>
              {/* Delete button - stops event propagation to prevent conversation selection */}
              <button
                className="delete-conversation-btn"
                onClick={(e) => handleDeleteClick(e, conversation.id)}
                title="Delete conversation"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Confirmation dialog for conversation deletion with danger variant */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Conversation"
        message="Are you sure you want to delete this conversation? This action cannot be undone and all messages will be permanently lost."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
};

export default AllConversations;
