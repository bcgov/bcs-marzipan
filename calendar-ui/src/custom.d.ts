// src/custom.d.ts
declare module 'react-dom/client';

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.svg' {
  const content: string;
  export default content;
}

interface ImportMetaEnv {
  readonly PROD: boolean;
  readonly DEV: boolean;
  readonly MODE: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_LOG_LEVEL?: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'NONE';
  readonly VITE_LOG_TIMESTAMP?: string;
  readonly VITE_LOG_CONTEXT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
