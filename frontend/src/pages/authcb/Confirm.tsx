'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import type { EmailOtpType } from '@supabase/supabase-js';

function ConfirmHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleConfirm = async () => {
      const token_hash = searchParams.get('token_hash');
      const type = searchParams.get('type') as EmailOtpType | null;
      const next = searchParams.get('next') || '/';

      if (!token_hash || !type) {
        router.replace('/auth-error?error=expired');
        return;
      }

      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({ type, token_hash });

      if (error) {
        setErrorMsg(error.message);
        router.replace(`/auth-error?error=expired&message=${encodeURIComponent(error.message)}`);
      } else if (type === 'recovery') {
        router.replace('/reset-password');
      } else {
        router.replace(next);
      }
    };

    handleConfirm();
  }, [router, searchParams]);

  if (errorMsg) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Confirmation error: {errorMsg}</div>;
  }

  return (
    <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
      Verifying confirmation...
    </div>
  );
}

export default function AuthConfirmPage() {
  return (
    <Suspense fallback={<div style={{ padding: '60px', textAlign: 'center' }}>Loading...</div>}>
      <ConfirmHandler />
    </Suspense>
  );
}
