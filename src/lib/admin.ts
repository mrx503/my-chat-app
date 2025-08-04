
// This file is new
// IMPORTANT: This is a simplified admin role management system.
// For a production application, consider a more robust solution like
// custom claims in Firebase Auth or a dedicated roles collection in Firestore.

// Add the Firebase UIDs of users who should have admin access.
const ADMIN_USER_IDS = [
    '2P304aYdM8bY25tL8tXyWp6qZ8j1', // This is a default admin, you can replace or remove it.
    'mveAjU8vc5N420GQqrwcr8Cwzhn1', // The user you just added.
    'UgTCMaFiJ5St3TqK6mXJwPy0Elu1',
    // Add more admin UIDs here if needed.
];

export function getAdminUids() {
    return ADMIN_USER_IDS;
}

export function isAdmin(uid: string | undefined): boolean {
    if (!uid) return false;
    return ADMIN_USER_IDS.includes(uid);
}
