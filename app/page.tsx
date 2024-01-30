import { getFrameMetadata } from '@coinbase/onchainkit';
import type { Metadata } from 'next';

const frameMetadata = getFrameMetadata({
  buttons: ['Subscribe via XMTP'],
  image: 'https://xmtp-frame-subscribe-button.vercel.app/banner.jpeg',
  post_url: 'https://xmtp-frame-subscribe-button.vercel.app/api/frame',
});

export const metadata: Metadata = {
  title: 'XMTP.org',
  description: 'LFG',
  openGraph: {
    title: 'XMTP.org',
    description: 'LFG',
    images: ['https://xmtp-frame-subscribe-button.vercel.app/banner.jpeg'],
  },
  other: {
    ...frameMetadata,
  },
};

export default function Page() {
  return (
    <>
      <h1>XMTP Consent</h1>
    </>
  );
}
