
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Report } from "@/lib/types";
import { columns } from "./columns";
import { DataTable } from "@/components/data-table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

async function getReports(): Promise<Report[]> {
    const reportsRef = collection(db, 'reports');
    const q = query(reportsRef, where('status', '==', 'pending'), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
        return [];
    }
    
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            timestamp: data.timestamp.toDate().toISOString(),
        }
    }) as unknown as Report[];
}

export default async function AdminReportsPage() {
    const data = await getReports();

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Content Reports</CardTitle>
                    <CardDescription>
                        Review and manage user-submitted reports for clips.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <DataTable columns={columns} data={data} filterColumnId="reporterEmail" />
                </CardContent>
            </Card>
        </div>
    );
}
