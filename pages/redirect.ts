'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const conversation = new URLSearchParams(window.location.search).get('conversation');
    console.log('conversation', conversation);
    if (conversation?.length > 10) {
      let redirectUrl = `https://app.converse.xyz/dm/${conversation}`;
      //let redirectUrl = `https://alpha.xmtp.chat/dm/${conversation}`;
      console.log('redirectUrl', redirectUrl);
      router.push(redirectUrl);
    } else {
    }
  }, [router]);
}
