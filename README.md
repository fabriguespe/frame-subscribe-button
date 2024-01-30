# XMTP Subscribe Button Tutorial

This tutorial will guide you through the process of creating a frame, the first opt-in message, and a subscribe button for consent confirmation using the XMTP (Cross Messaging Transaction Protocol) framework.

## Prerequisites

### Setting Up with Ngrok

To set up a localhost url that you can test with the [Frames Debugger](https://warpcast.com/~/developers/embeds) you can use the servie Ngrok. Thi swill generate a public URL that forwards actions to your localhost.

First Signup up to grok

OSX:

```jsx
brew install ngrok/ngrok/ngrok
ngrok authtoken <your_auth_token>
ngrok http 3000
```

### Step 1: Create a Frame

A frame is a container for your XMTP application. It's defined in the app/page.tsx file. Here's how to create it:

```jsx
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
```

### Step 2: Create the First Opt-In Message

The first opt-in message is sent when a user subscribes. This is handled in the app/api/frame/route.ts file:

```jsx
async function getResponse(req: NextRequest): Promise<NextResponse> {
  let accountAddress = '';
  let returnMessage = '';
  try {
    const body: { untrustedData?: { fid?: number } } = await req.json();
    const fid = body.untrustedData?.fid;
    if (fid) {
      console.log('FID:', fid);
      const response = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          api_key: process.env.NEYNAR_API_KEY as string,
        },
      });
      const data = (await response.json()) as any;
      const user = data.users[0];
      accountAddress = user.verifications[0]; // Assuming the address is the first item in the 'verifications' array
      if (!accountAddress) returnMessage = 'No address found';
      let wallet = await initialize_the_wallet_from_key();
      let client = await create_a_client(wallet);
      let isOnNetwork = await check_if_an_address_is_on_the_network(client, accountAddress);
      if (isOnNetwork) {
        let conversation = await start_a_new_conversation(client, accountAddress);
        let message = await send_a_message(
          conversation,
          `You're almost there! To complete your subscription and start receiving updates, please confirm your consent by clicking the link below:
          https://xmtp-frame-subscribe-button.vercel.app/consent
          This is a double opt-in process to ensure your privacy and consent are respected. Thank you for joining us!`,
        );
        console.log('Message sent:', message.id);
        returnMessage = 'Subscribed! Check your (request) inbox for a confirmation link.';
      } else returnMessage = 'Address is not on the XMTP network. Sign in';
    }
  }
```

### Step 3: Create the Subscribe Button for Consent Confirmation

The subscribe button is created in the pages/consent.tsx file. When clicked, it triggers the consent process:

```jsx
export function Consent() {
  ...
  // Define the handleClick function
  const handleClick = async () => {
    try {
      // Set loading to true
      setLoading(true);
      // Get the subscriber
      let wallet = await connectWallet();
      let client = await Client.create(wallet, { env: process.env.NEXT_PUBLIC_XMTP_ENV });
      console.log(client.address);
      // Refresh the consent list to make sure your application is up-to-date with the
      await client.contacts.refreshConsentList();

      // Get the consent state of the subscriber
      let state = client.contacts.consentState(client.address);

      // If the state is unknown or blocked, allow the subscriber
      if (state === 'unknown' || state === 'denied') {
        state = 'allowed';
        await client.contacts.allow([client.address]);
      } else if (state === 'allowed') {
        state = 'denied';
        await client.contacts.deny([client.address]);
      }

      // Set the subscription label
      setSubscriptionStatus('Consent State: ' + state);

      // Set loading to false
      setLoading(false);
    } catch (error) {
      // Log the error
      console.log(error);
    }
  };

  return (
    <div
      style={styles.SubscribeButtonContainer}
      className={`Subscribe ${loading ? 'loading' : ''}`}
    >
      <p></p>
      <p>By clicking the button, you are providing double opt-in consent for us to contact you.</p>
      <button style={styles.SubscribeButton} onClick={handleClick}>
        {loading ? 'Loading... ' : subscriptionStatus}
      </button>
    </div>
  );
}
```

### Step 4: Run the Application

```bash
yarn dev
```
