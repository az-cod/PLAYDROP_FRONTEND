'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleAuth = async () => {
      const code = searchParams.get('code');
      const next = searchParams.get('next') || searchParams.get('redirect') || '/';

      if (!code) {
        router.replace('/');
        return;
      }

      const supabase = createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        setErrorMsg(error.message);
        router.replace(`/auth-error?error=invalid&message=${encodeURIComponent(error.message)}`);
      } else {
        router.replace(next);
      }
    };

    handleAuth();
  }, [router, searchParams]);

  if (errorMsg) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Authentication error: {errorMsg}</div>;
  }

  return (
    <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
      Authenticating...
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div style={{ padding: '60px', textAlign: 'center' }}>Loading...</div>}>
      <CallbackHandler />
    </Suspense>
  );
}
