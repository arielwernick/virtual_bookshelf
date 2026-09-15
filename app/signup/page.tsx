import { Suspense } from 'react';
import SignupClient from './SignupClient';

export const metadata = { title: 'Create account' };

export default function SignupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupClient />
    </Suspense>
  );
}
