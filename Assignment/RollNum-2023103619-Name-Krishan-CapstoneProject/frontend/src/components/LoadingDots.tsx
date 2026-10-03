/**
 * LoadingDots Component
 * 
 * A simple animated loading indicator consisting of three pulsating dots.
 * Used to indicate loading states throughout the application with a smooth,
 * visually appealing animation that draws user attention without being distracting.
 * 
 * Key Features:
 * - Three-dot animation with staggered timing
 * - CSS-based animations for smooth performance
 * - Reusable across different loading contexts
 * - Minimal footprint and lightweight rendering
 * - Consistent styling with the typing indicator
 */

import React from 'react';

/**
 * LoadingDots functional component
 * 
 * Renders an animated three-dot loading indicator.
 * The animation is handled entirely through CSS classes,
 * making it performant and smooth across different devices.
 * 
 * @returns {JSX.Element} A div containing three animated dots
 */
const LoadingDots: React.FC = () => {
  return (
    /* Container with typing indicator styling for consistency */
    <div className="typing-indicator">
      {/* Dots container - holds all three animated dots */}
      <div className="typing-dots">
        {/* Individual dots - each animated with slight delay for staggered effect */}
        <div className="typing-dot"></div>
        <div className="typing-dot"></div>
        <div className="typing-dot"></div>
      </div>
    </div>
  );
};

export default LoadingDots;
