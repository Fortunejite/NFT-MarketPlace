import React, { useState, useEffect } from 'react';
import {
  Typography,
  Radio,
  message,
  Card,
  Row,
  Col,
  Pagination,
  Tag,
  Button,
  Modal,
} from 'antd';
import { AptosClient } from 'aptos';
import { useWallet } from '@aptos-labs/wallet-adapter-react';

const { Title } = Typography;
const { Meta } = Card;

const client = new AptosClient('https://fullnode.devnet.aptoslabs.com/v1');

type NFT = {
  id: number;
  owner: string;
  name: string;
  description: string;
  uri: string;
  price: number;
  for_sale: number;
  rarity: number;
};

interface MarketViewProps {
  marketplaceAddr: string;
}

const rarityColors = {
  1: 'green',
  2: 'blue',
  3: 'purple',
  4: 'orange',
};

const rarityLabels = {
  1: 'Common',
  2: 'Uncommon',
  3: 'Rare',
  4: 'Super Rare',
};

const truncateAddress = (address: string, start = 6, end = 4) =>
  `${address.slice(0, start)}...${address.slice(-end)}`;

const MarketView: React.FC<MarketViewProps> = ({ marketplaceAddr }) => {
  const { signAndSubmitTransaction } = useWallet();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [rarity, setRarity] = useState<'all' | number>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [isBuyModalVisible, setIsBuyModalVisible] = useState(false);
  const [selectedNft, setSelectedNft] = useState<NFT | null>(null);

  useEffect(() => {
    fetchNFTs();
  }, []);

  // Fetch NFTs from Marketplace
  const fetchNFTs = async (selectedRarity?: number) => {
    try {
      const resource = `${marketplaceAddr}::NFTMarketplaceV2::Marketplace`;

      const response = await client.getAccountResource(
        marketplaceAddr,
        resource
      );

      const nftList = (response.data as { nfts: NFT[] }).nfts;

      const decodeHexString = (hexString: string): string => {
        return new TextDecoder().decode(
          new Uint8Array(
            hexString.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
          )
        );
      };

      const decodedNfts = nftList.map((nft) => ({
        ...nft,
        name: decodeHexString(nft.name.slice(2)),
        description: decodeHexString(nft.description.slice(2)),
        uri: decodeHexString(nft.uri.slice(2)),
        price: nft.price / 1e8,
      }));

      const filteredNfts = decodedNfts.filter(
        (nft) => nft.for_sale === 1 && (selectedRarity === undefined || nft.rarity === selectedRarity)
      );

      setNfts(filteredNfts);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      message.error('Failed to fetch NFTs.');
    }
  };

  const handleBuyClick = (nft: NFT) => {
    setSelectedNft(nft);
    setIsBuyModalVisible(true);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedNft) return;

    try {
      const priceInOctas = Math.round(selectedNft.price * 1e8);

      const payload = {
        type: 'entry_function_payload',
        function: `${marketplaceAddr}::NFTMarketplaceV2::purchase_nft`,
        type_arguments: [],
        arguments: [
          marketplaceAddr,
          selectedNft.id.toString(),
          priceInOctas.toString(),
        ],
      };

      const response = await signAndSubmitTransaction(payload);
      await client.waitForTransaction(response.hash);

      message.success('NFT purchased successfully!');
      setIsBuyModalVisible(false);
      fetchNFTs(rarity === 'all' ? undefined : rarity);
    } catch (error) {
      console.error('Error purchasing NFT:', error);
      message.error('Failed to purchase NFT.');
    }
  };

  const handleCancelBuy = () => {
    setIsBuyModalVisible(false);
    setSelectedNft(null);
  };

  const paginatedNfts = nfts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div style={{ textAlign: 'center' }}>
      <Title level={2}>Marketplace</Title>

      {/* Filter Section */}
      <Radio.Group
        value={rarity}
        onChange={(e) => {
          const selected = e.target.value;
          setRarity(selected);
          fetchNFTs(selected === 'all' ? undefined : selected);
        }}
        buttonStyle="solid"
        style={{ marginBottom: 20 }}
      >
        <Radio.Button value="all">All</Radio.Button>
        {Object.entries(rarityLabels).map(([key, label]) => (
          <Radio.Button key={key} value={parseInt(key)}>
            {label}
          </Radio.Button>
        ))}
      </Radio.Group>

      {/* NFT Grid */}
      <Row gutter={[24, 24]} justify="center">
        {paginatedNfts.map((nft) => (
          <Col key={nft.id} xs={24} sm={12} md={8} lg={6}>
            <Card
              hoverable
              style={{ maxWidth: 240, margin: '0 auto' }}
              cover={<img alt={nft.name} src={nft.uri} />}
              actions={[
                <Button type="link" onClick={() => handleBuyClick(nft)}>
                  Buy
                </Button>,
              ]}
            >
              <Tag color={rarityColors[nft.rarity]}>{rarityLabels[nft.rarity]}</Tag>
              <Meta title={nft.name} description={`Price: ${nft.price} APT`} />
              <p>{nft.description}</p>
              <p>ID: {nft.id}</p>
              <p>Owner: {truncateAddress(nft.owner)}</p>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Pagination */}
      <Pagination
        current={currentPage}
        pageSize={pageSize}
        total={nfts.length}
        onChange={setCurrentPage}
        style={{ marginTop: 30 }}
      />

      {/* Buy Modal */}
      <Modal
        title="Purchase NFT"
        visible={isBuyModalVisible}
        onCancel={handleCancelBuy}
        footer={[
          <Button key="cancel" onClick={handleCancelBuy}>
            Cancel
          </Button>,
          <Button key="confirm" type="primary" onClick={handleConfirmPurchase}>
            Confirm Purchase
          </Button>,
        ]}
      >
        {selectedNft && (
          <>
            <p><strong>NFT ID:</strong> {selectedNft.id}</p>
            <p><strong>Name:</strong> {selectedNft.name}</p>
            <p><strong>Description:</strong> {selectedNft.description}</p>
            <p><strong>Rarity:</strong> {rarityLabels[selectedNft.rarity]}</p>
            <p><strong>Price:</strong> {selectedNft.price} APT</p>
            <p><strong>Owner:</strong> {truncateAddress(selectedNft.owner)}</p>
          </>
        )}
      </Modal>
    </div>
  );
};

export default MarketView;
