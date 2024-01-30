import { getFrameMetadata } from '@coinbase/onchainkit';
import type { Metadata } from 'next';

// Detect if we are in development
const isDevelopment = process.env.NODE_ENV !== 'production';

// Use ngrok URL for API calls if in development, otherwise use prod URL
const apiUrl = isDevelopment ? process.env.NEXT_PUBLIC_NGROK_URL : process.env.NEXT_PUBLIC_PROD_URL;

const frameMetadata = getFrameMetadata({
  buttons: ['Subscribe via XMTP'],
  image: process.env.NEXT_PUBLIC_PROD_URL + '/banner.jpeg',
  post_url: apiUrl + '/api/frame',
});
export const metadata: Metadata = {
  title: 'XMTP.org',
  description: 'LFG',
  openGraph: {
    title: 'XMTP.org',
    description: 'LFG',
    images: [process.env.NEXT_PUBLIC_PROD_URL + '/banner.jpeg'],
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
