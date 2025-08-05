
"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const { login, signup } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      router.push('/');
    } catch (error: any) {
      toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: error.message,
      })
    }
  };
  
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
        toast({
            variant: 'destructive',
            title: 'Agreement Required',
            description: 'You must agree to the Terms of Use and Privacy Policy.',
        });
        return;
    }
    try {
      await signup(email, password, name);
      router.push('/');
       toast({
          title: 'Welcome!',
          description: 'Your account has been created successfully.',
      })
    } catch (error: any) {
       toast({
          variant: 'destructive',
          title: 'Signup Failed',
          description: error.message,
      })
    }
  };

  const handleCheckedChange = (checked: boolean) => {
    // Wrap the state update in a timeout to defer it slightly,
    // preventing the flushSync error from Radix UI component internals.
    setTimeout(() => {
        setAgreedToTerms(checked);
    }, 0);
  };

  const LegalLinks = () => (
    <div className="text-center text-xs text-muted-foreground space-x-4">
        <Link href="/terms-of-use" className="hover:underline" target="_blank">Terms</Link>
        <Link href="/privacy-policy" className="hover:underline" target="_blank">Privacy</Link>
        <Link href="/contact-us" className="hover:underline" target="_blank">Contact</Link>
    </div>
  );

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Tabs defaultValue="login" className="w-[400px]">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
            <Card>
                <CardHeader>
                    <CardTitle>Login</CardTitle>
                    <CardDescription>Enter your credentials to access your account.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="login-email">Email</Label>
                            <Input id="login-email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="login-password">Password</Label>
                            <Input id="login-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                        </div>
                        <Button type="submit" className="w-full">Login</Button>
                    </form>
                </CardContent>
                <CardFooter>
                    <LegalLinks />
                </CardFooter>
            </Card>
        </TabsContent>
        <TabsContent value="signup">
            <Card>
                <CardHeader>
                    <CardTitle>Sign Up</CardTitle>
                    <CardDescription>Create a new account to start chatting.</CardDescription>
                </CardHeader>
                <CardContent>
                     <form onSubmit={handleSignup} className="space-y-4">
                         <div className="space-y-2">
                            <Label htmlFor="signup-name">Username</Label>
                            <Input id="signup-name" type="text" placeholder="Choose a username" required value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="signup-email">Email</Label>
                            <Input id="signup-email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="signup-password">Password</Label>
                            <Input id="signup-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} />
                        </div>
                        <div className="items-top flex space-x-2">
                            <Checkbox id="terms1" checked={agreedToTerms} onCheckedChange={(checked) => handleCheckedChange(checked as boolean)} />
                            <div className="grid gap-1.5 leading-none">
                                <label
                                htmlFor="terms1"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                I agree to the <Link href="/terms-of-use" target="_blank" className="underline text-primary">Terms of Use</Link> and <Link href="/privacy-policy" target="_blank" className="underline text-primary">Privacy Policy</Link>.
                                </label>
                            </div>
                        </div>
                        <Button type="submit" className="w-full">Sign Up</Button>
                    </form>
                </CardContent>
                 <CardFooter>
                    <LegalLinks />
                </CardFooter>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
