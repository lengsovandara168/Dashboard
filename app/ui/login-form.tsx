'use client';

import { SignIn } from '@clerk/nextjs';

export default function LoginForm() {
  return (
    <div className="flex items-center justify-center">
      <SignIn 
        appearance={{
          elements: {
            formButtonPrimary: 'bg-blue-500 hover:bg-blue-600 text-white',
            card: 'shadow-lg',
          }
        }}
        routing="path"
        path="/login"
        signUpUrl="/sign-up"
      />
    </div>
  );
}
