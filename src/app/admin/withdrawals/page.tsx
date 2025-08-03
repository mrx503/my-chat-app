// This file is new
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { WithdrawalRequest } from "@/lib/types";
import { columns } from "./columns";
import { DataTable } from "@/components/data-table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

async function getWithdrawalRequests(): Promise<WithdrawalRequest[]> {
    const requestsRef = collection(db, 'withdrawalRequests');
    const q = query(requestsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
        return [];
    }
    
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) as WithdrawalRequest[];
}

export default async function AdminWithdrawalPage() {
    const data = await getWithdrawalRequests();

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Withdrawal Requests</CardTitle>
                    <CardDescription>
                        Review all withdrawal requests. Note: This panel is for review only. Processing must be done manually (e.g., sending the Vodafone Cash transfer).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <DataTable columns={columns} data={data} filterColumnId="email" />
                </CardContent>
            </Card>
        </div>
    );
}
