import { GetServerSideProps } from 'next';
import React from 'react';

export const getServerSideProps: GetServerSideProps = async (context) => {
  const conversation = context.query.conversation;

  if (conversation && conversation.length > 10) {
    let redirectUrl = `https://app.converse.xyz/dm/${conversation}`;
    return {
      redirect: {
        destination: redirectUrl,
        permanent: false,
      },
    };
  }

  return {
    redirect: {
      destination: '/',
      permanent: false,
    },
  };
};

// Minimal React component that satisfies Next.js's requirement
const RedirectPage = () => null;
export default RedirectPage;
