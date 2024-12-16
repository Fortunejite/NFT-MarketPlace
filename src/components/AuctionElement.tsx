import { useState, useEffect } from 'react';
import { Card, Col, Tag, Button } from 'antd';

const { Meta } = Card;

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

interface AuctionElementProps {
  auction: DecodedAuction;
  handleBuyClick: (auction: DecodedAuction) => void;
}

const rarityColors: { [key: number]: string } = {
  1: 'green',
  2: 'blue',
  3: 'purple',
  4: 'orange',
};

const rarityLabels: { [key: number]: string } = {
  1: 'Common',
  2: 'Uncommon',
  3: 'Rare',
  4: 'Super Rare',
};

const truncateAddress = (address: string, start = 6, end = 4) => {
  return `${address.slice(0, start)}...${address.slice(-end)}`;
};

const AuctionElement: React.FC<AuctionElementProps> = ({
  auction,
  handleBuyClick,
}) => {
  const [remainingTime, setRemainingTime] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const hasEnded = remainingTime.days === 0 && remainingTime.hours === 0 && remainingTime.minutes === 0 && remainingTime.seconds === 0;

  useEffect(() => {
    const interval = setInterval(() => {
      const nowInSeconds = Math.floor(Date.now() / 1000);
      const remaining = Number(auction.end_time) - nowInSeconds;

      if (remaining <= 0) {
        clearInterval(interval);
        setRemainingTime({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        const days = Math.floor(remaining / 86400); // Total days
        const hours = Math.floor((remaining % 86400) / 3600); // Remaining hours
        const minutes = Math.floor((remaining % 3600) / 60); // Remaining minutes
        const seconds = remaining % 60; // Remaining seconds

        setRemainingTime({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, [auction.end_time]);

  return (
    <Col
      key={auction.auction_id}
      xs={24}
      sm={12}
      md={8}
      lg={6}
      xl={6}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Card
        hoverable
        style={{
          width: '100%',
          maxWidth: '240px',
          margin: '0 auto',
        }}
        cover={<img alt={auction.name} src={auction.uri} />}
        actions={[
          <Button type='link' disabled={hasEnded} onClick={() => handleBuyClick(auction)}>
            {hasEnded ? 'Auction Ended' : 'Place bid'}
          </Button>,
        ]}
      >
        <Tag
          color={rarityColors[auction.rarity]}
          style={{
            fontSize: '14px',
            fontWeight: 'bold',
            marginBottom: '10px',
          }}
        >
          {rarityLabels[auction.rarity]}
        </Tag>

        <Meta
          title={auction.name}
          description={`Base price: ${auction.price} APT`}
        />
        <p>NFT ID: {auction.nft_id}</p>
        <p>Highest Bidder: {truncateAddress(auction.highest_bidder)}</p>
        <p>Bid Amount: {auction.highest_bid} {' APT'}</p>
        <p>
          Remaining Time:{' '}
          {remainingTime.days > 0 && `${remainingTime.days}d `}
          {remainingTime.hours}h {remainingTime.minutes}m {remainingTime.seconds}s
        </p>
      </Card>
    </Col>
  );
};

export default AuctionElement;
