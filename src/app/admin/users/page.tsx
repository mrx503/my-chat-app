
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { User } from "@/lib/types";
import { columns } from "./columns";
import { DataTable } from "@/components/data-table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";


async function getUsers(): Promise<User[]> {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('name'));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
        return [];
    }
    
    // Serialize Firestore Timestamps to plain strings
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            lastSeen: data.lastSeen ? data.lastSeen.toDate().toISOString() : null,
            bannedUntil: data.bannedUntil ? data.bannedUntil.toDate().toISOString() : null,
        }
    }) as unknown as User[];
}

export default async function AdminUsersPage() {
    const data = await getUsers();

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Users</CardTitle>
                    <CardDescription>A list of all registered users in the application. Manage their status and balances.</CardDescription>
                </CardHeader>
                <CardContent>
                     <DataTable columns={columns} data={data} filterColumnId="name" />
                </CardContent>
            </Card>
        </div>
    );
}
