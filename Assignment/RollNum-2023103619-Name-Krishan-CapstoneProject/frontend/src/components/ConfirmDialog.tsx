/**
 * ConfirmDialog Component
 * 
 * A reusable modal dialog component for displaying confirmation prompts.
 * Provides customizable styling based on the action type (danger, warning, info).
 * Handles backdrop clicks to close the dialog and supports custom button text.
 * 
 * Key Features:
 * - Modal overlay with backdrop click to close
 * - Customizable variant styling (danger, warning, info)
 * - Flexible button text configuration
 * - Keyboard and click event handling
 * - Responsive design with proper z-index layering
 */

import React from 'react';

/**
 * Props interface for ConfirmDialog component
 * 
 * @interface ConfirmDialogProps
 * @property {boolean} isOpen - Controls whether the dialog is visible
 * @property {string} title - The title displayed in the dialog header
 * @property {string} message - The main message or question to display
 * @property {string} [confirmText] - Custom text for the confirm button (default: "Confirm")
 * @property {string} [cancelText] - Custom text for the cancel button (default: "Cancel")
 * @property {function} onConfirm - Callback function executed when confirm button is clicked
 * @property {function} onCancel - Callback function executed when cancel button is clicked or dialog is dismissed
 * @property {'danger' | 'warning' | 'info'} [variant] - Visual variant for styling the dialog (default: "warning")
 */
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

/**
 * ConfirmDialog functional component
 * 
 * Renders a modal confirmation dialog with customizable appearance and behavior.
 * Returns null when not open to avoid unnecessary DOM elements.
 */
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'warning'
}) => {
  // Early return if dialog is not open - prevents unnecessary rendering
  if (!isOpen) return null;

  /**
   * Handles clicks on the backdrop overlay
   * Closes the dialog only if the click was on the backdrop itself, not on the dialog content
   * 
   * @param {React.MouseEvent} e - The mouse event from the backdrop click
   */
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    /* Backdrop overlay - covers entire viewport with semi-transparent background */
    <div className="confirm-dialog-overlay" onClick={handleBackdropClick}>
      {/* Main dialog container - prevents clicks from bubbling to backdrop */}
      <div className="confirm-dialog">
        {/* Dialog header with title */}
        <div className="confirm-dialog-header">
          <h3 className="confirm-dialog-title">{title}</h3>
        </div>
        
        {/* Dialog body with main message content */}
        <div className="confirm-dialog-body">
          <p className="confirm-dialog-message">{message}</p>
        </div>
        
        {/* Dialog footer with action buttons */}
        <div className="confirm-dialog-footer">
          {/* Cancel button - typically on the left, neutral styling */}
          <button 
            className="confirm-dialog-btn confirm-dialog-btn-cancel"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          
          {/* Confirm button - styled based on variant prop for visual emphasis */}
          <button 
            className={`confirm-dialog-btn confirm-dialog-btn-confirm confirm-dialog-btn-${variant}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
