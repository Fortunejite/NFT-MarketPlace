// TODO# 1: Define Module and Marketplace Address
address 0x33b9e5f89e3e7b236af5bc85fcc6b2c5ee1f5871a389ae0f3f8d2477766f961d {

    module NFTMarketplaceV2 {
        use 0x1::signer;
        use 0x1::vector;
        use 0x1::coin;
        use 0x1::aptos_coin;

        // TODO# 2: Define NFT Structure
        struct NFT has store, key {
            id: u64,
            owner: address,
            name: vector<u8>,
            description: vector<u8>,
            uri: vector<u8>,
            price: u64,
            for_sale: u8, // 0 for no, 1 for sale, 2 for auction
            rarity: u8  // 1 for common, 2 for rare, 3 for epic, etc.
        }

        struct Auction has store, key {
            auction_id: u64,
            nft_id: u64,
            seller: address,
            start_time: u64, // Start time in seconds
            end_time: u64,   // End time in seconds
            highest_bid: u64,
            highest_bidder: address,
            minimum_increment: u64,
            status: u8 // 1 for ongoing, 2 for finalized
        }


        // TODO# 3: Define Marketplace Structure
        struct Marketplace has key {
            nfts: vector<NFT>,
            auctions: vector<Auction>
        }

        
        // TODO# 4: Define ListedNFT Structure
        struct ListedNFT has copy, drop {
            id: u64,
            price: u64,
            rarity: u8
        }
        struct ActiveAuction has copy, drop {
            auction_id: u64,
            nft_id: u64,
            seller: address,
            start_time: u64, // Start time in seconds
            end_time: u64,   // End time in seconds
            highest_bid: u64,
            highest_bidder: address,
            status: u8, // 1 for ongoing, 2 for finalized
            minimum_increment: u64,
        }


        // TODO# 5: Set Marketplace Fee
        const MARKETPLACE_FEE_PERCENT: u64 = 2; // 2% fee


        // TODO# 6: Initialize Marketplace   
        public entry fun initialize(account: &signer) {
            let marketplace = Marketplace {
                nfts: vector::empty<NFT>(),
                auctions: vector::empty<Auction>()
            };
            move_to(account, marketplace);
        }    


        // TODO# 7: Check Marketplace Initialization
         #[view]
        public fun is_marketplace_initialized(marketplace_addr: address): bool {
            exists<Marketplace>(marketplace_addr)
        }


        // TODO# 8: Mint New NFT
        public entry fun mint_nft(
            account: &signer,
            marketplace_addr: address,
            name: vector<u8>, 
            description: vector<u8>, 
            uri: vector<u8>, 
            rarity: u8,
        ) acquires Marketplace {
            let marketplace = borrow_global_mut<Marketplace>(marketplace_addr);
            let nft_id = vector::length(&marketplace.nfts);

            // Charge a minting fee 
            let new_nft = NFT {
                id: nft_id,
                owner: signer::address_of(account),
                name,
                description,
                uri,
                price: 0,
                for_sale: 0,
                rarity
            };

            vector::push_back(&mut marketplace.nfts, new_nft);
        }



        // TODO# 9: View NFT Details
        #[view]
        public fun get_nft_details(marketplace_addr: address, nft_id: u64): (u64, address, vector<u8>, vector<u8>, vector<u8>, u64, u8, u8) acquires Marketplace {
            let marketplace = borrow_global<Marketplace>(marketplace_addr);
            let nft = vector::borrow(&marketplace.nfts, nft_id);

            (nft.id, nft.owner, nft.name, nft.description, nft.uri, nft.price, nft.for_sale, nft.rarity)
        }

        
        // TODO# 10: List NFT for Sale
        public entry fun list_for_sale(account: &signer, marketplace_addr: address, nft_id: u64, price: u64) acquires Marketplace {
            let marketplace = borrow_global_mut<Marketplace>(marketplace_addr);
            let nft_ref = vector::borrow_mut(&mut marketplace.nfts, nft_id);

            assert!(nft_ref.owner == signer::address_of(account), 100); // Caller is not the owner
            assert!(nft_ref.for_sale == 0, 101); // NFT is already listed
            assert!(price > 0, 102); // Invalid price

            nft_ref.for_sale = 1;
            nft_ref.price = price;
        }


        // TODO# 11: Update NFT Price
        public entry fun set_price(account: &signer, marketplace_addr: address, nft_id: u64, price: u64) acquires Marketplace {
            let marketplace = borrow_global_mut<Marketplace>(marketplace_addr);
            let nft_ref = vector::borrow_mut(&mut marketplace.nfts, nft_id);

            assert!(nft_ref.owner == signer::address_of(account), 200); // Caller is not the owner
            assert!(price > 0, 201); // Invalid price

            nft_ref.price = price;
        }


        // TODO# 12: Purchase NFT
        public entry fun purchase_nft(account: &signer, marketplace_addr: address, nft_id: u64, payment: u64) acquires Marketplace {
            let marketplace = borrow_global_mut<Marketplace>(marketplace_addr);
            let nft_ref = vector::borrow_mut(&mut marketplace.nfts, nft_id);

            assert!(nft_ref.for_sale == 1, 400); // NFT is not for sale
            assert!(payment >= nft_ref.price, 401); // Insufficient payment

            // Calculate marketplace fee
            let fee = (nft_ref.price * MARKETPLACE_FEE_PERCENT) / 100;
            let seller_revenue = payment - fee;

            // Transfer payment to the seller and fee to the marketplace
            coin::transfer<aptos_coin::AptosCoin>(account, nft_ref.owner, seller_revenue);
            coin::transfer<aptos_coin::AptosCoin>(account, marketplace_addr, fee);

            // Transfer ownership
            nft_ref.owner = signer::address_of(account);
            nft_ref.for_sale = 0;
        }


        // TODO# 13: Check if NFT is for Sale
        #[view]
        public fun is_nft_for_sale(marketplace_addr: address, nft_id: u64): u8 acquires Marketplace {
            let marketplace = borrow_global<Marketplace>(marketplace_addr);
            let nft = vector::borrow(&marketplace.nfts, nft_id);
            nft.for_sale
        }


        // TODO# 14: Get NFT Price
        #[view]
        public fun get_nft_price(marketplace_addr: address, nft_id: u64): u64 acquires Marketplace {
            let marketplace = borrow_global<Marketplace>(marketplace_addr);
            let nft = vector::borrow(&marketplace.nfts, nft_id);
            nft.price
        }


        // TODO# 15: Transfer Ownership
        public entry fun transfer_ownership(account: &signer, marketplace_addr: address, nft_id: u64, new_owner: address) acquires Marketplace {
            let marketplace = borrow_global_mut<Marketplace>(marketplace_addr);
            let nft_ref = vector::borrow_mut(&mut marketplace.nfts, nft_id);

            assert!(nft_ref.owner == signer::address_of(account), 300); // Caller is not the owner
            assert!(nft_ref.owner != new_owner, 301); // Prevent transfer to the same owner

            // Update NFT ownership and reset its for_sale status and price
            nft_ref.owner = new_owner;
            nft_ref.for_sale = 0;
            nft_ref.price = 0;
        }


        // TODO# 16: Retrieve NFT Owner
        #[view]
        public fun get_owner(marketplace_addr: address, nft_id: u64): address acquires Marketplace {
            let marketplace = borrow_global<Marketplace>(marketplace_addr);
            let nft = vector::borrow(&marketplace.nfts, nft_id);
            nft.owner
        }


        // TODO# 17: Retrieve NFTs for Sale
        #[view]
        public fun get_all_nfts_for_owner(marketplace_addr: address, owner_addr: address, limit: u64, offset: u64): vector<u64> acquires Marketplace {
            let marketplace = borrow_global<Marketplace>(marketplace_addr);
            let nft_ids = vector::empty<u64>();

            let nfts_len = vector::length(&marketplace.nfts);
            let end = min(offset + limit, nfts_len);
            let mut_i = offset;
            while (mut_i < end) {
                let nft = vector::borrow(&marketplace.nfts, mut_i);
                if (nft.owner == owner_addr) {
                    vector::push_back(&mut nft_ids, nft.id);
                };
                mut_i = mut_i + 1;
            };

            nft_ids
        }
 

        // TODO# 18: Retrieve NFTs for Sale
        #[view]
        public fun get_all_nfts_for_sale(marketplace_addr: address, limit: u64, offset: u64): vector<ListedNFT> acquires Marketplace {
            let marketplace = borrow_global<Marketplace>(marketplace_addr);
            let nfts_for_sale = vector::empty<ListedNFT>();

            let nfts_len = vector::length(&marketplace.nfts);
            let end = min(offset + limit, nfts_len);
            let mut_i = offset;
            while (mut_i < end) {
                let nft = vector::borrow(&marketplace.nfts, mut_i);
                if (nft.for_sale == 1) {
                    let listed_nft = ListedNFT { id: nft.id, price: nft.price, rarity: nft.rarity };
                    vector::push_back(&mut nfts_for_sale, listed_nft);
                };
                mut_i = mut_i + 1;
            };

            nfts_for_sale
        }


        // TODO# 19: Define Helper Function for Minimum Value
        // Helper function to find the minimum of two u64 numbers
        public fun min(a: u64, b: u64): u64 {
            if (a < b) { a } else { b }
        }


        // TODO# 20: Retrieve NFTs by Rarity
        // New function to retrieve NFTs by rarity
        #[view]
        public fun get_nfts_by_rarity(marketplace_addr: address, rarity: u8): vector<u64> acquires Marketplace {
            let marketplace = borrow_global<Marketplace>(marketplace_addr);
            let nft_ids = vector::empty<u64>();

            let nfts_len = vector::length(&marketplace.nfts);
            let mut_i = 0;
            while (mut_i < nfts_len) {
                let nft = vector::borrow(&marketplace.nfts, mut_i);
                if (nft.rarity == rarity) {
                    vector::push_back(&mut nft_ids, nft.id);
                };
                mut_i = mut_i + 1;
            };

            nft_ids
        }

        public entry fun start_auction(
            account: &signer,
            marketplace_addr: address,
            nft_id: u64,
            duration_seconds: u64,
            start_price: u64,
            minimum_increment: u64,
        ) acquires Marketplace {
            let marketplace = borrow_global_mut<Marketplace>(marketplace_addr);
            let nft_ref = vector::borrow_mut(&mut marketplace.nfts, nft_id);
            let auction_id = vector::length(&marketplace.auctions);

            assert!(nft_ref.owner == signer::address_of(account), 500); // Caller is not the owner
            assert!(nft_ref.for_sale == 0, 501); // NFT already listed for sale

            let current_time = aptos_framework::timestamp::now_seconds();
            let end_time = current_time + duration_seconds;

            nft_ref.for_sale = 2;
            nft_ref.price = start_price;

            let auction = Auction {
                auction_id,
                nft_id,
                seller: signer::address_of(account),
                start_time: current_time,
                end_time,
                highest_bid: 0,
                highest_bidder: @0,
                status: 1,
                minimum_increment,
            };

            vector::push_back(&mut marketplace.auctions, auction);
        }

        // Place Bid
        public entry fun place_bid(
            account: &signer,
            marketplace_addr: address,
            auction_id: u64,
            bid_amount: u64
        ) acquires Marketplace {
            let marketplace = borrow_global_mut<Marketplace>(marketplace_addr);
            let auction = vector::borrow_mut(&mut marketplace.auctions, auction_id);
            let nft_ref = vector::borrow_mut(&mut marketplace.nfts, auction.nft_id);

            let current_time = aptos_framework::timestamp::now_seconds();
            assert!(current_time >= auction.start_time, 512); // Auction hasn't started
            assert!(current_time <= auction.end_time, 513); // Auction has ended

            assert!(bid_amount >= nft_ref.price, 514); // Bid is not higher than the current highest
            if (auction.highest_bid > 0) {
                assert!(bid_amount >= auction.highest_bid + auction.minimum_increment, 515); // Bid is not higher than the current highest
            };
            let bidder_address = signer::address_of(account);

            if (auction.highest_bid > 0) {
                // Transfer previous bid back to the bidder
                coin::transfer<aptos_coin::AptosCoin>(
                    account,
                    auction.highest_bidder,
                    auction.highest_bid
                );
            };
            // Update auction state
            let remaining_balance = bid_amount - auction.highest_bid;
            auction.highest_bid = bid_amount;
            auction.highest_bidder = bidder_address;

            coin::transfer<aptos_coin::AptosCoin>(
                account,
                marketplace_addr,
                remaining_balance
            );
        }

        // Finalize Auction
        public entry fun finalize_auction(
            account: &signer,
            marketplace_addr: address, //remove
            auction_id: u64
        ) acquires Marketplace {
            let marketplace = borrow_global_mut<Marketplace>(marketplace_addr);
            let auction = vector::borrow_mut(&mut marketplace.auctions, auction_id);
            let nft_ref = vector::borrow_mut(&mut marketplace.nfts, auction.nft_id);

            let current_time = aptos_framework::timestamp::now_seconds();
            assert!(current_time > auction.end_time, 522); // Auction has not yet ended


            nft_ref.for_sale = 0;

            if (auction.highest_bid > 0) {
                // Transfer NFT ownership
                nft_ref.owner = auction.highest_bidder;
                nft_ref.price = auction.highest_bid;

                // Transfer payment to seller
                coin::transfer<aptos_coin::AptosCoin>(
                    account,
                    auction.seller,
                    auction.highest_bid
                );
            };

            // Mark auction as finalized
            auction.status = 2;
        }

        #[view]
        public fun get_auction_details(
            marketplace_addr: address,
            auction_id: u64
        ): (address, u64, u64, u64, address, u8) acquires Marketplace {
           let marketplace = borrow_global_mut<Marketplace>(marketplace_addr);
            let auction = vector::borrow_mut(&mut marketplace.auctions, auction_id);

            assert!(auction.auction_id == auction_id, 530); // Auction for this NFT does not exist.

            // Return auction details
            (
                auction.seller,
                auction.start_time,
                auction.end_time,
                auction.highest_bid,
                auction.highest_bidder,
                auction.status
            )
        }

        #[view]
        /// Gets the current highest bid and bidder for a specific auction.
        public fun get_highest_bid(
            marketplace_addr: address,
            auction_id: u64
        ): (u64, address) acquires Marketplace {
            let marketplace = borrow_global_mut<Marketplace>(marketplace_addr);
            let auction = vector::borrow_mut(&mut marketplace.auctions, auction_id);

            assert!(auction.auction_id == auction_id, 531); // Auction for this NFT does not exist.

            // Return highest bid and bidder address
            (auction.highest_bid, auction.highest_bidder)
        }

        #[view]
        /// Checks the current status of the auction (Ongoing, Ended, or Finalized).
        public fun get_auction_status(
            marketplace_addr: address,
            auction_id: u64
        ): u8 acquires Marketplace {
            let marketplace = borrow_global_mut<Marketplace>(marketplace_addr);
            let auction = vector::borrow_mut(&mut marketplace.auctions, auction_id);

            assert!(auction.auction_id == auction_id, 532); // Auction for this NFT does not exist.

            auction.status
        }

        #[view]
        /// Lists all NFTs currently up for auction in the marketplace.
        public fun list_active_auctions(
            marketplace_addr: address,
            limit: u64,
            offset: u64
        ): vector<ActiveAuction> acquires Marketplace {
            let marketplace = borrow_global_mut<Marketplace>(marketplace_addr);
            let active_auctions = vector::empty<ActiveAuction>();

            let auctions_len = vector::length(&marketplace.auctions);
            let end = min(offset + limit, auctions_len);
            let mut_i = offset;
            // Iterate through all auctions and add active ones to the result
            while (mut_i < end) {
                let auction = vector::borrow(&marketplace.auctions, mut_i);
                if (auction.status == 1) {
                    let active_auction = ActiveAuction {
                        auction_id: auction.auction_id,
                        nft_id: auction.nft_id,
                        seller: auction.seller,
                        start_time: auction.start_time,
                        end_time: auction.end_time,
                        highest_bid: auction.highest_bid,
                        highest_bidder: auction.highest_bidder,
                        status: auction.status,
                        minimum_increment: auction.minimum_increment,
                    };
                    vector::push_back(&mut active_auctions, active_auction);
                };
                mut_i = mut_i + 1;
            };
            active_auctions
        }
        #[view]
        /// Lists all NFTs currently up for auction in the marketplace.
        public fun list_past_auctions(
            marketplace_addr: address,
            limit: u64,
            offset: u64
        ): vector<ActiveAuction> acquires Marketplace {
            let marketplace = borrow_global_mut<Marketplace>(marketplace_addr);
            let past_auctions = vector::empty<ActiveAuction>();

            let auctions_len = vector::length(&marketplace.auctions);
            let end = min(offset + limit, auctions_len);
            let mut_i = offset;
            // Iterate through all auctions and add active ones to the result
            while (mut_i < end) {
                let auction = vector::borrow(&marketplace.auctions, mut_i);
                if (auction.status == 2) {
                    let active_auction = ActiveAuction {
                        auction_id: auction.auction_id,
                        nft_id: auction.nft_id,
                        seller: auction.seller,
                        start_time: auction.start_time,
                        end_time: auction.end_time,
                        highest_bid: auction.highest_bid,
                        highest_bidder: auction.highest_bidder,
                        status: auction.status,
                        minimum_increment: auction.minimum_increment,
                    };
                    vector::push_back(&mut past_auctions, active_auction);
                };
                mut_i = mut_i + 1;
            };
            past_auctions
        }
        #[view]
        /// Lists all NFTs currently up for auction in the marketplace.
        public fun list_all_auctions(
            marketplace_addr: address,
            limit: u64,
            offset: u64
        ): vector<ActiveAuction> acquires Marketplace {
            let marketplace = borrow_global_mut<Marketplace>(marketplace_addr);
            let auctions = vector::empty<ActiveAuction>();

            let auctions_len = vector::length(&marketplace.auctions);
            let end = min(offset + limit, auctions_len);
            let mut_i = offset;
            // Iterate through all auctions and add active ones to the result
            while (mut_i < end) {
                let auction = vector::borrow(&marketplace.auctions, mut_i);
                    let active_auction = ActiveAuction {
                        auction_id: auction.auction_id,
                        nft_id: auction.nft_id,
                        seller: auction.seller,
                        start_time: auction.start_time,
                        end_time: auction.end_time,
                        highest_bid: auction.highest_bid,
                        highest_bidder: auction.highest_bidder,
                        status: auction.status,
                        minimum_increment: auction.minimum_increment,
                    };
                    vector::push_back(&mut auctions, active_auction);
                mut_i = mut_i + 1;
            };
            auctions
        }

        #[view]
        public fun get_current_time(): u64 {
            aptos_framework::timestamp::now_seconds()
        }

    }
}
