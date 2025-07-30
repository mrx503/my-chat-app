
// This file is used to securely expose environment variables to the client side.
// They are loaded via next.config.ts and are available throughout the application
// without relying on process.env directly in client components.

export const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';
export const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '';
