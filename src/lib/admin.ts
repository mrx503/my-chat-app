// This file is new
// IMPORTANT: This is a simplified admin role management system.
// For a production application, consider a more robust solution like
// custom claims in Firebase Auth or a dedicated roles collection in Firestore.

// Add the Firebase UIDs of users who should have admin access.
const ADMIN_USER_IDS = [
    '2P304aYdM8bY25tL8tXyWp6qZ8j1', // Replace with your actual admin user UID
    // Add more admin UIDs here if needed
];

export function getAdminUids() {
    return ADMIN_USER_IDS;
}

export function isAdmin(uid: string | undefined): boolean {
    if (!uid) return false;
    return ADMIN_USER_IDS.includes(uid);
}
