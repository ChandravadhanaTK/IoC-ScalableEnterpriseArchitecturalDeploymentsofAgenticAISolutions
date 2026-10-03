/**
 * reportWebVitals.ts
 *
 * This utility file is used to measure and report web performance metrics
 * (Web Vitals) in a React application. It leverages the 'web-vitals' library
 * to collect key performance indicators such as CLS, FID, FCP, LCP, and TTFB.
 *
 * Usage:
 * - Import and call reportWebVitals in your application's entry point (index.tsx)
 * - Pass a callback function to handle the metrics (e.g., log to analytics)
 *
 * Metrics Collected:
 * - CLS (Cumulative Layout Shift): Visual stability
 * - FID (First Input Delay): Responsiveness to user input
 * - FCP (First Contentful Paint): Time to first content render
 * - LCP (Largest Contentful Paint): Time to main content render
 * - TTFB (Time to First Byte): Server response time
 *
 * For more information, see: https://web.dev/vitals/
 */

// Import the type definition for the performance report handler
import { ReportHandler } from 'web-vitals';

/**
 * reportWebVitals
 *
 * Dynamically imports the web-vitals library and registers the provided
 * callback to receive all core web vital metrics. This function is typically
 * called from index.tsx to enable performance monitoring in production.
 *
 * @param onPerfEntry - Optional callback function to handle each metric result
 */
const reportWebVitals = (onPerfEntry?: ReportHandler) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    // Dynamically import web-vitals and register all core metrics
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);   // Cumulative Layout Shift
      getFID(onPerfEntry);   // First Input Delay
      getFCP(onPerfEntry);   // First Contentful Paint
      getLCP(onPerfEntry);   // Largest Contentful Paint
      getTTFB(onPerfEntry);  // Time to First Byte
    });
  }
};

export default reportWebVitals;
