import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';
import { Wallet } from 'ethers';
import { Client } from 'xmtp-js-server';

// Function to handle the response
async function getResponse(req: NextRequest): Promise<NextResponse> {
  // Initialize variables
  let accountAddress = '';
  let returnMessage = '';
  console.log('Request:', req);
  try {
    // Parse the request body
    const body: { untrustedData?: { fid?: number } } = await req.json();
    const fid = body.untrustedData?.fid;
    if (fid) {
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
      // Initialize the wallet and client
      let wallet = await initialize_the_wallet();
      let client = await create_a_client(wallet);
      // Check if the account address is on the network
      let isOnNetwork = await check_if_an_address_is_on_the_network(client, accountAddress);
      if (isOnNetwork) {
        // Start a new conversation and send a message
        let conversation = await start_a_new_conversation(client, accountAddress);
        returnMessage = 'Subscribed! Check your inbox for a confirmation link.';
        send_a_message(
          conversation,
          `You're almost there! If you're viewing this in an inbox with portable consent, simply click the "Accept" button below to complete your subscription and start receiving updates. If the button doesn't appear, please confirm your consent by visiting the following link:\n
          ${process.env.NEXT_PUBLIC_PROD_URL}/consent\n
          This ensures your privacy and consent are respected. Thank you for joining us!`,
        );
      } else returnMessage = 'Address is not on the XMTP network. Sign in';
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
    <meta property="fc:frame:post_url" content="${process.env.NEXT_PUBLIC_NGROK_URL}/api/frame" />
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
async function initialize_the_wallet() {
  // You'll want to replace this with a wallet from your application
  let wallet = Wallet.createRandom();
  console.log(`Wallet address: ${wallet.address}`);
  return wallet;
}

//Send a message
async function send_a_message(conversation, content) {
  if (conversation) {
    conversation.send(content);
  }
}

// Create a client
async function create_a_client(wallet) {
  if (!wallet) {
    console.log('Wallet is not initialized');
    return;
  }

  let xmtp = await Client.create(wallet, { env: 'production' });
  console.log('Client created', xmtp.address);
  return xmtp;
}

//Check if an address is on the network
async function check_if_an_address_is_on_the_network(xmtp, accountAddress) {
  if (xmtp) {
    const isOnDevNetwork = await xmtp.canMessage(accountAddress);
    console.log(`Can message: ${isOnDevNetwork}`);
    return isOnDevNetwork;
  }
  return false;
}

//Start a new conversation
async function start_a_new_conversation(xmtp, accountAddress) {
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
