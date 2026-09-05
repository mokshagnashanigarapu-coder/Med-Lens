function getModelName(): string {
  const envModel = process.env.GEMINI_MODEL;
  if (!envModel || envModel.includes('2.5') || envModel.includes('2.0') || envModel.includes('1.5')) {
    return 'gemini-3.6-flash';
  }
  return envModel;
}

export const APP_CONFIG = {
  appName: "MedLens",
  appDescription: "AI-Powered Clinical Information Intelligence & Provenance Tracking System",
  gemini: {
    model: getModelName(),
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
