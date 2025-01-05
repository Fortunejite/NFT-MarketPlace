import {
  AptosAccount,
  AptosClient,
} from 'aptos';
import { useEffect, useState } from 'react';
import { Buffer } from 'buffer';

// Initialize the Aptos Client
const client = new AptosClient('https://fullnode.testnet.aptoslabs.com/v1');

type DecodedAuction = {
  nft_id: number;
  name: string;
  description: string;
  uri: string;
  rarity: number;
  price: number;
  for_sale: number;
  auction_id: number;
  seller: string;
  end_time: number;
  highest_bid: number;
  highest_bidder: string;
  minimum_increment: number;
};

// Helper: Convert a private key from Hex to Uint8Array
function hexToUint8Array(hex: string) {
  if (hex.startsWith('0x')) hex = hex.slice(2); // Remove 0x prefix if present
  return Uint8Array.from(Buffer.from(hex, 'hex'));
}

interface AuctionPollingProps {
  auctions: DecodedAuction[];
  setAuctions: React.Dispatch<React.SetStateAction<DecodedAuction[]>>;
  marketplaceAddr: string;
}

const AuctionPolling: React.FC<AuctionPollingProps> = ({
  auctions,
  setAuctions,
  marketplaceAddr,
}) => {
  const [blockchainTime, setBlockchainTime] = useState<number>(0);

  // Fetch Blockchain Time
  const updateBlockchainTime = async () => {
    try {
      const time = (
        await client.view({
          function: `${marketplaceAddr}::NFTMarketplaceV2::get_current_time`,
          arguments: [],
          type_arguments: [],
        })
      )[0] as number;
      setBlockchainTime(time);
    } catch (error) {
      console.error('Error fetching blockchain time:', error);
    }
  };

  // Finalize Auction
  const endAuction = async (auctionId: number) => {
    try {
      // Ensure private key is available
      const privateKeyHex = process.env.REACT_APP_PRIVATE_KEY;
      if (!privateKeyHex) {
        throw new Error('Private key not set in environment variables');
      }

      // Initialize Aptos Account
      const privateKey = hexToUint8Array(privateKeyHex);
      const marketplaceAccount = new AptosAccount(privateKey);

      // Create Entry Function Payload
      const payload = {
        type: 'entry_function_payload',
        function: `${marketplaceAddr}::NFTMarketplaceV2::finalize_auction`,
        type_arguments: [],
        arguments: [marketplaceAddr, auctionId.toString()], // Ensure `auctionId` is a string
      };

      // Generate and Sign Transaction
      const rawTransaction = await client.generateTransaction(
        marketplaceAccount.address(),
        payload,
      );

      const signedTransaction = await client.signTransaction(
        marketplaceAccount,
        rawTransaction,
      );

      // Submit Transaction
      const transactionRes = await client.submitTransaction(signedTransaction);

      // Wait for Confirmation
      console.log('Transaction submitted:', transactionRes.hash);
      await client.waitForTransaction(transactionRes.hash);
      console.log('Auction finalized successfully!');
    } catch (error) {
      console.error('Error finalizing auction:', error);
    }
  };

  // Polling Logic
  useEffect(() => {
    const interval = setInterval(async () => {
      await updateBlockchainTime(); // Update blockchain time
      auctions?.forEach((auction) => {
        if (blockchainTime >= auction.end_time && auction.for_sale === 2) {
          console.log(`Ending auction ${auction.auction_id}`);
          endAuction(auction.auction_id);
        }
      });
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [blockchainTime, auctions]);

  useEffect(() => {
    updateBlockchainTime(); // Initial fetch
  }, []);

  return <></>;
};

export default AuctionPolling;
