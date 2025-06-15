import Vapi from '@vapi-ai/web';

// Create a global flag to ensure VAPI is initialized only once
declare global {
  interface Window {
    _vapiInitialized: boolean;
  }
}

// Initialize VAPI only once
let vapiInstance: any;

if (typeof window !== 'undefined') {
  if (!window._vapiInitialized) {
    vapiInstance = new Vapi(process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN!);
    window._vapiInitialized = true;
  }
} else {
  vapiInstance = new Vapi(process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN!);
}

export const vapi = vapiInstance;