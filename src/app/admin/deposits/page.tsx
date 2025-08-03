
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { DepositRequest } from "@/lib/types";
import { columns } from "./columns";
import { DataTable } from "@/components/data-table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

async function getDepositRequests(): Promise<DepositRequest[]> {
    const requestsRef = collection(db, 'depositRequests');
    const q = query(requestsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
        return [];
    }
    
    // Serialize Firestore Timestamps to plain strings before passing to the client
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt.toDate().toISOString(),
        }
    }) as unknown as DepositRequest[];
}

export default async function AdminDepositPage() {
    const data = await getDepositRequests();

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Deposit Requests</CardTitle>
                    <CardDescription>
                        Review and manage all pending and completed deposit requests. Approving a request will add coins to the user's balance.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <DataTable columns={columns} data={data} filterColumnId="email" />
                </CardContent>
            </Card>
        </div>
    );
}
