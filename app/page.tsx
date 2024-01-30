import { getFrameMetadata } from '@coinbase/onchainkit';
import type { Metadata } from 'next';

const frameMetadata = getFrameMetadata({
  buttons: ['Subscribe via XMTP'],
  image: process.env.NEXT_PUBLIC_IMAGES_URL + '/banner.jpeg',
  post_url: process.env.NEXT_PUBLIC_API_URL + '/api/frame',
});
export const metadata: Metadata = {
  title: 'XMTP.org',
  description: 'LFG',
  openGraph: {
    title: 'XMTP.org',
    description: 'LFG',
    images: [process.env.NEXT_PUBLIC_IMAGES_URL + '/banner.jpeg'],
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
