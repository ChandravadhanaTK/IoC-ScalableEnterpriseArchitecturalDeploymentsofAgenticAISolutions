// Production builds alias the demo engine to this stub (see vite.config.js).
export async function demoRequest() {
  throw new Error("demo transport is not available in production builds");
}
