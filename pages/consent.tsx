import { useState } from 'react';
import { Client } from '@xmtp/xmtp-js';
import { ethers } from 'ethers';

export function Consent() {
  // State for loading status
  const [loading, setLoading] = useState(false);
  // State for subscription status
  const [subscriptionStatus, setSubscriptionStatus] = useState('Subscribe with your wallet');

  const styles = {
    SubscribeButtonContainer: {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      borderRadius: '5px',
      textAlign: 'center',
      justifyContent: 'center', // Center children vertically
      alignItems: 'center', // Center children horizontally
      height: '100vh', // Fill the entire height of the viewport
    },
    SubscribeButton: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '10px 20px',
      borderRadius: '20px', // Make corners round
      marginBottom: '2px',
      textAlign: 'left',
      cursor: 'pointer',
      transition: 'background-color 0.3s ease',
      fontWeight: 'bold',
      color: '#333333',
      backgroundColor: '#ededed',
      border: 'none',
      fontSize: '12px',
    },
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        return provider.getSigner();
      } catch (error) {
        console.error('User rejected request', error);
      }
    } else {
      console.error('Metamask not found');
    }
  };

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

export default Consent;
