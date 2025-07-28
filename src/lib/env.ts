
// This file is used to securely expose environment variables to the client side.
// By defining them here, we ensure they are loaded correctly from the server environment
// and are available throughout the application without relying on process.env directly in client components.

export const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';
