'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/actions/auth.action';

const SignOutButton = () => {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    
    const handleSignOut = async () => {
        setIsLoading(true);
        try {
            await signOut();
            router.push('/sign-in');
        } catch (error) {
            console.error('Failed to sign out:', error);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <Button 
            onClick={handleSignOut} 
            disabled={isLoading}
            variant="outline"
            className="text-primary-100 border border-primary-100 hover:bg-primary-100 hover:text-white"
        >
            {isLoading ? 'Signing out...' : 'Sign Out'}
        </Button>
    );
};

export default SignOutButton;
