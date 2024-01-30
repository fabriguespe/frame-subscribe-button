import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';
import { Wallet } from 'ethers';
import { Client } from '@xmtp/xmtp-js';

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
      const data = await response.json();
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
          `You're almost there! If you're viewing this in an inbox with portable consent, simply click the "Accept" button below to complete your subscription and start receiving updates. If the button doesn't appear, please confirm your consent by visiting the following link:\n
          https://fac9-2800-810-593-244-25a3-75bf-f64f-445c.ngrok-free.app/consent\n
          This ensures your privacy and consent are respected. Thank you for joining us!`,
        );
        console.log('Message sent:', message.id);
        returnMessage = 'Subscribed! Check your inbox for a confirmation link.';
      } else returnMessage = 'Address is not on the XMTP network. Sign in';
    }
  } catch (err) {
    console.error(err);
  }

  return new NextResponse(`<!DOCTYPE html><html><head>
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="https://fac9-2800-810-593-244-25a3-75bf-f64f-445c.ngrok-free.app/banner.jpeg" />
    <meta property="fc:frame:button:1" content="${returnMessage}" />
    <meta property="fc:frame:post_url" content="https://fac9-2800-810-593-244-25a3-75bf-f64f-445c.ngrok-free.app/api/frame" />
  </head></html>`);
}

//Send a message
async function send_a_message(conversation, content) {
  if (conversation) {
    const message = await conversation.send(content);
    console.log(`Message sent: "${message.content}"`);
    return message;
  }
}

//Initialize the wallet
async function initialize_the_wallet_from_key() {
  // You'll want to replace this with a wallet from your application
  let wallet = new Wallet(process.env.XMTP_PRIVATE_KEY as string);
  console.log(`Wallet address: ${wallet.address}`);
  return wallet;
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
