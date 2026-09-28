export interface ProjectFile {
  path: string;
  category: 'Root Config' | 'App Module' | 'Kotlin Source' | 'Resources' | 'CI/CD Workflow';
  language: string;
  description: string;
}

export interface CompressionResult {
  originalName: string;
  originalSize: number;
  originalWidth: number;
  originalHeight: number;
  originalUrl: string;
  compressedSize: number;
  compressedWidth: number;
  compressedHeight: number;
  compressedUrl: string;
  format: 'jpeg' | 'png' | 'webp';
  quality: number;
  iterations: number;
  processingTimeMs: number;
}
