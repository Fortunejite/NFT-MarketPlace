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
  Input,
} from 'antd';
import { AptosClient } from 'aptos';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import AuctionElement from '../components/AuctionElement';
import AuctionPolling from '../components/AuctionPolling';

const { Title } = Typography;
const { Meta } = Card;

const client = new AptosClient('https://fullnode.testnet.aptoslabs.com/v1');

type Auction = {
  auction_id: number;
  seller: string;
  nft_id: number;
  end_time: number;
  highest_bid: number;
  highest_bidder: string;
  minimum_increment: number;
};

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

interface AuctionViewProps {
  marketplaceAddr: string;
}

const filterLabel: { [key: number]: string } = {
  1: 'All',
  2: 'Past',
  3: 'Active',
};

const rarityLabels: { [key: number]: string } = {
  1: 'Common',
  2: 'Uncommon',
  3: 'Rare',
  4: 'Super Rare',
};

const AuctionView: React.FC<AuctionViewProps> = ({ marketplaceAddr }) => {
  const { signAndSubmitTransaction } = useWallet();
  const [auctions, setAuctions] = useState<DecodedAuction[]>([]);
  const [filter, setFilter] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [isAuctionModalVisible, setIsAuctionModalVisible] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState<DecodedAuction | null>(
    null,
  );
  const [bid, setbid] = useState<string>('');

  useEffect(() => {
    handleFetchAuctions(filter);
  }, []);

  const handleFetchAuctions = async (filter = 1) => {
    try {
      let functionName = filter === 1 ? 'list_all_auctions' : filter === 2 ? 'list_past_auctions' : 'list_active_auctions'
      const auctions = (
        await client.view({
          function: `${marketplaceAddr}::NFTMarketplaceV2::${functionName}`,
          arguments: [marketplaceAddr, '100', '0'],
          type_arguments: [],
        })
      )[0] as Auction[];

      const hexToUint8Array = (hexString: string): Uint8Array => {
        const bytes = new Uint8Array(hexString.length / 2);
        for (let i = 0; i < hexString.length; i += 2) {
          bytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
        }
        return bytes;
      };

      const decodedAuctions = await Promise.all(
        auctions.map(async (auction) => {
          const nftDetails = await client.view({
            function: `${marketplaceAddr}::NFTMarketplaceV2::get_nft_details`,
            arguments: [marketplaceAddr, auction?.nft_id.toString()],
            type_arguments: [],
          });

          const [, , name, description, uri, price, forSale, rarity] =
            nftDetails as [
              number,
              string,
              string,
              string,
              string,
              number,
              number,
              number,
            ];

          return {
            ...auction,
            minimum_increment: auction.minimum_increment / 100000000, // Convert octas to APT
            highest_bid: auction.highest_bid / 100000000, // Convert octas to APT
            name: new TextDecoder().decode(hexToUint8Array(name.slice(2))),
            description: new TextDecoder().decode(
              hexToUint8Array(description.slice(2)),
            ),
            uri: new TextDecoder().decode(hexToUint8Array(uri.slice(2))),
            rarity,
            price: price / 100000000, // Convert octas to APT
            for_sale: forSale,
          };
        }),
      );

      setAuctions(decodedAuctions);
    } catch (error) {
      console.error('Error fetching live auctions:', error);
      message.error('Failed to fetch live auctions.');
    }
  };

  const handleBuyClick = (auction: DecodedAuction) => {
    setSelectedAuction(auction);
    setIsAuctionModalVisible(true);
  };

  const handleCancelBuy = () => {
    setIsAuctionModalVisible(false);
    setSelectedAuction(null);
    setbid('')
  };

  const handleConfirmPurchase = async () => {
    if (!selectedAuction) return;

    try {
      
      if (!bid) {
        message.error('Please enter a bid amount.');
        return;
      } else if (selectedAuction.highest_bid === 0 && parseFloat(bid) < selectedAuction.price) {
        message.error('Bid amount must be higher than the current price.');
        return;
      } else if (parseFloat(bid) < selectedAuction.highest_bid + selectedAuction.minimum_increment) {
        message.error(
          'Bid amount must be higher than the current highest bid with the minimum increment.',
        );
        return;
      }
      const bidInOctas = parseFloat(bid) * 100000000;
      
      const entryFunctionPayload = {
        type: 'entry_function_payload',
        function: `${marketplaceAddr}::NFTMarketplaceV2::place_bid`,
        type_arguments: [],
        arguments: [
          marketplaceAddr,
          selectedAuction.auction_id.toString(),
          bidInOctas.toString(),
        ],
      };

      const response = await (window as any).aptos.signAndSubmitTransaction(
        entryFunctionPayload,
      );
      await client.waitForTransaction(response.hash);

      message.success('Bid placed successfully!');
      setIsAuctionModalVisible(false);
      handleFetchAuctions(); // Refresh NFT list
      console.log('signAndSubmitTransaction:', signAndSubmitTransaction);
      setbid('');
    } catch (error) {
      console.error('Error purchasing NFT:', error);
      message.error('Failed to purchase NFT.');
    }
  };

  const paginatedAuctions = auctions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <div
      style={{
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Title level={2} style={{ marginBottom: '20px' }}>
        Auctions
      </Title>
      <AuctionPolling auctions={auctions} setAuctions={setAuctions} marketplaceAddr={marketplaceAddr} />

      {/* Filter Buttons */}
      <div style={{ marginBottom: '20px' }}>
        <Radio.Group
          value={filter}
          onChange={(e) => {
            const selectedFilter = e.target.value;
            setFilter(selectedFilter);
            handleFetchAuctions(selectedFilter);
          }}
          buttonStyle='solid'
        >
          <Radio.Button value={1}>All</Radio.Button>
          <Radio.Button value={2}>Past</Radio.Button>
          <Radio.Button value={3}>Active</Radio.Button>
        </Radio.Group>
      </div>

      {/* Card Grid */}
      <Row
        gutter={[24, 24]}
        style={{
          marginTop: 20,
          width: '100%',
          display: 'flex',
          justifyContent: 'center', // Center row content
          flexWrap: 'wrap',
        }}
      >
        {auctions.map((auction) => (
          <AuctionElement
            key={auction.auction_id}
            auction={auction}
            handleBuyClick={handleBuyClick}
          />
        ))}
      </Row>

      {/* Pagination */}
      <div style={{ marginTop: 30, marginBottom: 30 }}>
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={auctions.length}
          onChange={(page) => setCurrentPage(page)}
          style={{ display: 'flex', justifyContent: 'center' }}
        />
      </div>

      {/* Buy Modal */}
      <Modal
        title='Place Bid'
        visible={isAuctionModalVisible}
        onCancel={handleCancelBuy}
        footer={[
          <Button key='cancel' onClick={handleCancelBuy}>
            Cancel
          </Button>,
          <Button key='confirm' type='primary' onClick={handleConfirmPurchase}>
            Place Bid
          </Button>,
        ]}
      >
        {selectedAuction && (
          <>
            <p>
              <strong>NFT ID:</strong> {selectedAuction.auction_id}
            </p>
            <p>
              <strong>Name:</strong> {selectedAuction.name}
            </p>
            <p>
              <strong>Description:</strong> {selectedAuction.description}
            </p>
            <p>
              <strong>Rarity:</strong> {rarityLabels[selectedAuction.rarity]}
            </p>
            <p>
              <strong>Base Price:</strong> {selectedAuction.price}
            </p>
            <p>
              <strong>Highest Bid:</strong> {selectedAuction.highest_bid} {' APT'}
            </p>
            <Input
              type='number'
              placeholder='Place a bid'
              value={bid}
              onChange={(e) => setbid(e.target.value)}
              style={{ marginTop: 10 }}
            />
            <span>Minimum Increment: {selectedAuction.minimum_increment} APT</span>
          </>
        )}
      </Modal>
    </div>
  );
};

export default AuctionView;
