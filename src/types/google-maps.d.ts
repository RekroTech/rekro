/// <reference types="google.maps" />

// Extend window interface to allow dynamic callbacks
declare global {
    interface Window {
        [key: string]: unknown;
    }
}
export {};
