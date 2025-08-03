// This file is new
import React from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  DollarSign,
  Landmark,
} from 'lucide-react';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { DepositRequest, WithdrawalRequest } from '@/lib/types';


async function getStats() {
    const usersSnapshot = await getDocs(collection(db, "users"));
    const depositsSnapshot = await getDocs(query(collection(db, "depositRequests"), where("status", "==", "pending")));
    const withdrawalsSnapshot = await getDocs(query(collection(db, "withdrawalRequests"), where("status", "==", "pending")));

    return {
        totalUsers: usersSnapshot.size,
        pendingDeposits: depositsSnapshot.size,
        pendingWithdrawals: withdrawalsSnapshot.size,
    };
}

async function getRecentRequests() {
     const depositsQuery = query(collection(db, "depositRequests"), where("status", "==", "pending"), limit(5));
     const withdrawalsQuery = query(collection(db, "withdrawalRequests"), where("status", "==", "pending"), limit(5));

     const [depositsSnapshot, withdrawalsSnapshot] = await Promise.all([
         getDocs(depositsQuery),
         getDocs(withdrawalsQuery)
     ]);

     const deposits = depositsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DepositRequest));
     const withdrawals = withdrawalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WithdrawalRequest));
     
     return { deposits, withdrawals };
}

export default async function AdminDashboardPage() {
  const stats = await getStats();
  const { deposits, withdrawals } = await getRecentRequests();
  
  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Total registered users in the app</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Deposits</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingDeposits}</div>
            <p className="text-xs text-muted-foreground">Needs review and approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Withdrawals</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingWithdrawals}</div>
            <p className="text-xs text-muted-foreground">Needs review and processing</p>
          </CardContent>
        </Card>
      </div>

       <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
            <Card>
                <CardHeader className="flex flex-row items-center">
                    <div className="grid gap-2">
                        <CardTitle>Recent Pending Deposits</CardTitle>
                        <CardDescription>Top 5 pending deposit requests.</CardDescription>
                    </div>
                    <Button asChild size="sm" className="ml-auto gap-1">
                        <Link href="/admin/deposits">View All <DollarSign className="h-4 w-4" /></Link>
                    </Button>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Email</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                             {deposits.map(req => (
                                <TableRow key={req.id}>
                                    <TableCell>
                                        <div className="font-medium">{req.email}</div>
                                        <div className="text-sm text-muted-foreground">{req.senderVodafoneNumber}</div>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">EGP {req.amount}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                     </Table>
                     {deposits.length === 0 && <p className="text-center text-muted-foreground p-4">No pending deposits.</p>}
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center">
                    <div className="grid gap-2">
                        <CardTitle>Recent Pending Withdrawals</CardTitle>
                        <CardDescription>Top 5 pending withdrawal requests.</CardDescription>
                    </div>
                    <Button asChild size="sm" className="ml-auto gap-1">
                        <Link href="/admin/withdrawals">View All<Landmark className="h-4 w-4" /></Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Email</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                         <TableBody>
                             {withdrawals.map(req => (
                                <TableRow key={req.id}>
                                    <TableCell>
                                        <div className="font-medium">{req.email}</div>
                                        <div className="text-sm text-muted-foreground">{req.vodafoneNumber}</div>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">{req.amount} Coins</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {withdrawals.length === 0 && <p className="text-center text-muted-foreground p-4">No pending withdrawals.</p>}
                </CardContent>
            </Card>
       </div>
    </div>
  );
}
