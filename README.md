# Aptos NFT Marketplace

Welcome to the Aptos NFT Marketplace, a decentralized platform built on the Aptos blockchain that enables users to mint, buy, sell, and auction NFTs seamlessly.

## Features

- **Minting NFTs**: Initially, only the marketplace owner could mint NFTs. Now, all users have the capability to create their own unique digital assets.

- **Buying and Selling**: Users can list their NFTs for sale at fixed prices, and interested buyers can purchase them directly.

- **Auction Functionality**: Users can initiate auctions for their NFTs, allowing others to place bids with a specified minimum increment. This feature fosters competitive bidding and ensures fair pricing.

## Getting Started

To set up the project locally:

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/Fortunejite/NFT-MarketPlace.git
   cd NFT-MarketPlace
   ```

2.	**Install Dependencies:**
Ensure you have Node.js installed. Then, run:

```bash
npm install
```

3.	**Configure Environment Variables:**
Create a .env file in the root directory and add the following:

```bash
REACT_APP_APTOS_NODE_URL=https://fullnode.devnet.aptoslabs.com/v1
REACT_APP_MARKETPLACE_ADDRESS=your_marketplace_address
```

Replace your_marketplace_address with the actual address of your deployed marketplace contract.

4.	**Run the Application:**

```bash
npm start
```

The application will be accessible at http://localhost:3000.

## Smart Contract Deployment

The marketplace’s smart contracts are written in Move and deployed on the Aptos blockchain. To deploy them:

1.	**Install the Aptos CLI:**
Follow the official guide to install the Aptos CLI.
	
 2.	**Initialize and Deploy:**

```bash
aptos init
aptos move compile
aptos move publish --assume-yes --gas-unit-price 100
```

This will compile and deploy the Move modules to your Aptos account.

## Contributing

We welcome contributions! Please fork the repository and create a pull request with your changes. Ensure that your code adheres to the project’s coding standards and includes appropriate tests.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Acknowledgements

•	Aptos Labs for their comprehensive documentation and support.

•	Ant Design for the UI components.

•	Aptos Wallet Adapter for wallet integration.

## Contact

For any inquiries or support, please open an issue on the GitHub repository.

**This project is an Aptos-related initiative.**

 
