export const APP_CONFIG = {
  appName: "MedLens",
  appDescription: "AI-Powered Clinical Information Intelligence & Provenance Tracking System",
  gemini: {
    model: "gemini-2.5-flash",
    apiKey: process.env.GEMINI_API_KEY || "",
    timeoutMs: 12000, // 12-second bounded timeout for hackathon responsiveness
    maxRetries: 1, // At most 1 controlled retry for transient failures
    backoffMs: 1000,
  },
  limits: {
    maxFileUploadSizeBytes: 10 * 1024 * 1024, // 10MB
    supportedMimeTypes: ["application/pdf", "image/png", "image/jpeg", "text/plain"],
  },
  defaultSourceLocationFallback: "Source location unavailable",
};
