import { FrameRequest, getFrameAccountAddress, getFrameMessage } from '@coinbase/onchainkit';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'redis';

// Detect if we are in development
const isDevelopment = process.env.NODE_ENV !== 'production';
// Use ngrok URL for API calls if in development, otherwise use prod URL
const apiUrl = isDevelopment ? process.env.NEXT_PUBLIC_NGROK_URL : process.env.NEXT_PUBLIC_PROD_URL;
// Create and connect the client
const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
  password: process.env.REDIS_PASSWORD, // Assuming your password is stored in an environment variable
});

await redisClient.connect();

async function getResponse(req: NextRequest): Promise<NextResponse> {
  let accountAddress = '';
  // Read the body from the Next Request
  const body: FrameRequest = await req.json();
  // Validate the message
  const { isValid, message } = await getFrameMessage(body);
  // Determine the experience based on the validity of the message
  if (isValid) {
    // Get from the message the Account Address of the user using the Frame
    accountAddress = await getFrameAccountAddress(message, {
      NEYNAR_API_KEY: 'NEYNAR_ONCHAIN_KIT',
      //NEYNAR_API_KEY: process.env.NEYNAR_API_KEY as string,
    });
    console.log('accountAddress:', accountAddress);
  }

  const isAlreadySubscribed = await redisClient.get(accountAddress);
  console.log(`Is already subscribed: ${isAlreadySubscribed}`);
  return NextResponse.redirect(`${apiUrl}/redirect?conversation=${isAlreadySubscribed}`, {
    status: 302,
  });
}

export async function POST(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

export const dynamic = 'force-dynamic';
