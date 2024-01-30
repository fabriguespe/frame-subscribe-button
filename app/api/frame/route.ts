import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';
import { Wallet } from 'ethers';
import { Client } from '@xmtp/xmtp-js';
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
await redisClient.flushDb();
console.log(`Is development: ${isDevelopment} - ${apiUrl}`);
// Function to handle the response
async function getResponse(req: NextRequest): Promise<NextResponse> {
  // Initialize variables
  let accountAddress = '';
  let returnMessage = '';
  try {
    // Parse the request body
    /*try {
      // Step 2. Read the body from the Next Request
      const body: FrameRequest = await req.json();
      console.log('Frame Request:', body);
      // Step 3. Get from the body the Account Address of the user using the Frame
      accountAddress = await getFrameAccountAddress(body, {
        NEYNAR_API_KEY: process.env.NEYNAR_API_KEY as string,
      });
    } catch (err) {
      console.error(err);
    }*/

    console.log(`Account address: ${accountAddress}`);
    const body: { untrustedData?: { fid?: number } } = await req.json();
    const fid = body.untrustedData?.fid;
    const buttonIndex = body.untrustedData?.buttonIndex;
    if (fid) {
      console.log('buttonIndex:', buttonIndex);
      console.log('Farcaster Id:', fid);
      // Fetch user data from the API
      const response = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          api_key: process.env.NEYNAR_API_KEY as string,
        },
      });
      // Parse the response data
      const data = await response.json();
      const user = data.users[0];
      // Get the account address from the user verifications
      accountAddress = user.verifications[0]; // Assuming the address is the first item in the 'verifications' array
      if (!accountAddress) returnMessage = 'No address found';
      console.log(`Account address: ${accountAddress}`);
      const isAlreadySubscribed = await redisClient.get(accountAddress);
      console.log(`Is already subscribed: ${isAlreadySubscribed}`);
      if (isAlreadySubscribed) {
        returnMessage = 'You are already subscribed';
      } else {
        redisClient.set(accountAddress, 'subscribed');
        // Initialize the wallet and client
        let wallet = await initializeWallet();
        let client = await createXMTPClient(wallet);
        // Check if the account address is on the network
        let isOnNetwork = await checkAddressIsOnNetwork(client, accountAddress);
        if (isOnNetwork === true) {
          // Start a new conversation and send a message
          let conversation = await newConversation(client, accountAddress);
          returnMessage = 'Subscribed! Check your inbox for a confirmation link.';
          sendMessage(
            conversation,
            `You're almost there! If you're viewing this in an inbox with portable consent, simply click the "Accept" button below to complete your subscription and start receiving updates. If the button doesn't appear, please confirm your consent by visiting the following link:\n\n\n${apiUrl}/consent\n\nThis ensures your privacy and consent are respected. Thank you for joining us!`,
          );
        } else returnMessage = 'Address is not on the XMTP network. ';
      }
    }
  } catch (err) {
    // Log any errors
    console.error(err);
  }
  // Return the response
  return new NextResponse(`<!DOCTYPE html><html><head>
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${process.env.NEXT_PUBLIC_PROD_URL}/banner.jpeg" />
    <meta property="fc:frame:button:1" content="${returnMessage}" />
    <meta property="fc:frame:post_url" content="${apiUrl}/api/frame" />
  </head></html>`);
}

//Initialize the wallet
async function initialize_the_wallet_from_key() {
  // You'll want to replace this with a wallet from your application
  let wallet = new Wallet(process.env.XMTP_PRIVATE_KEY as string);
  console.log(`Wallet address: ${wallet.address}`);
  return wallet;
}

//Initialize the wallet
async function initializeWallet() {
  // You'll want to replace this with a wallet from your application
  let wallet = Wallet.createRandom();
  console.log(`Wallet address: ${wallet.address}`);
  return wallet;
}

//Send a message
async function sendMessage(conversation, content) {
  if (conversation) {
    conversation.send(content);
  }
}

// Create a client
async function createXMTPClient(wallet) {
  if (!wallet) {
    console.log('Wallet is not initialized');
    return;
  }

  let xmtp = await Client.create(wallet, { env: 'production' });
  console.log('Client created', xmtp.address);
  return xmtp;
}

//Check if an address is on the network
async function checkAddressIsOnNetwork(xmtp, accountAddress) {
  if (xmtp) {
    const isOnDevNetwork = await xmtp.canMessage(accountAddress);
    console.log(`Can message: ${isOnDevNetwork}`);
    return isOnDevNetwork;
  }
  return false;
}

//Start a new conversation
async function newConversation(xmtp, accountAddress) {
  if (xmtp) {
    let conversation = await xmtp.conversations.newConversation(accountAddress);
    console.log(`Conversation created with ${accountAddress}`);
    return conversation;
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

export async function GET(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

export const dynamic = 'force-dynamic';
