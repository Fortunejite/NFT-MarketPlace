import React, { useState } from "react";
import "./App.css";
import { Layout, Modal, message } from "antd";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AptosClient } from "aptos";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

// Component Imports
import NavBar from "./components/NavBar";
import MarketView from "./pages/MarketView";
import MyNFTs from "./pages/MyNFTs";
import AuctionView from "./pages/AuctionView";
import MintNFTModal from "./components/MintNFTModal";

// Constants
const APTOS_NODE_URL = "https://fullnode.devnet.aptoslabs.com/v1";
const MARKETPLACE_ADDRESS = "0x33b9e5f89e3e7b236af5bc85fcc6b2c5ee1f5871a389ae0f3f8d2477766f961d";

// Aptos Client
const client = new AptosClient(APTOS_NODE_URL);

const App: React.FC = () => {
  const { account } = useWallet();
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Handle opening the Mint NFT modal
  const openMintNFTModal = () => setIsModalVisible(true);

  // Helper function: Encode string to byte array
  const encodeToVector = (str: string) => Array.from(new TextEncoder().encode(str));

  // Handle Mint NFT logic
  const handleMintNFT = async (values: { name: string; description: string; uri: string; rarity: number }) => {
    try {
      if (!account) throw new Error("Wallet not connected.");

      const payload = {
        type: "entry_function_payload",
        function: `${MARKETPLACE_ADDRESS}::NFTMarketplaceV2::mint_nft`,
        type_arguments: [],
        arguments: [
          MARKETPLACE_ADDRESS,
          encodeToVector(values.name),
          encodeToVector(values.description),
          encodeToVector(values.uri),
          values.rarity,
        ],
      };

      const txnResponse = await (window as any).aptos.signAndSubmitTransaction(payload);
      await client.waitForTransaction(txnResponse.hash);

      message.success("NFT minted successfully!");
      setIsModalVisible(false);
    } catch (error) {
      console.error("Minting Error:", error);
      message.error("Failed to mint NFT. Please try again.");
    }
  };

  return (
    <Router>
      <Layout>
        <NavBar onMintNFTClick={openMintNFTModal} />

        <Routes>
          <Route path="/" element={<MarketView marketplaceAddr={MARKETPLACE_ADDRESS} />} />
          <Route path="/my-nfts" element={<MyNFTs />} />
          <Route path="/auctions" element={<AuctionView marketplaceAddr={MARKETPLACE_ADDRESS} />} />
        </Routes>

        <MintNFTModal
          visible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
          onMint={handleMintNFT}
        />
      </Layout>
    </Router>
  );
};

export default App;
