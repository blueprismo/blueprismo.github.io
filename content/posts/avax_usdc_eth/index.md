---
title: AVAX USDC to ETH USDC
Summary: The Joe's journey to swap from AVAX network into the Ethereum network thanks to celer
date: "2024-11-18"
---

![](traderjoe.webp)

# Intro

Well well well, seems like a youngling is buying a little flat. << [It ain't me, it ain't me, I ain't no fortunate one, no](https://youtu.be/ZWijx_AgPiA?si=SpP8kqMnFkSnuvCR&t=39)>>
If you've experienced the burden of going through a mortgage process, then you know you have to drain all the money you can from all your different eggs' baskets :smile:

Back in the day I staked some little JOEs in a pool, it ain't much, but it was around 70-80 Eur that I just drop there. When the mortgage came, it was time for me to get them out with some little reward of 38.5 USDCs only to stake those tokens.

For the curious ones, I'm going to explain this little journey into the crypto-transactions. Take it as a casual conversation in front of the coffee machine, or as an anechdotal chronicle.

The objective is centralize some tokens into my Ethereum network, with a stablecoin (USDC in my case), to help my mortgage payment.
Centralizing the decentralized stuff, heh...!

## Step 1: Unstake

My origin tokens (JOE), are staked in the [joe's staking platform](https://lfj.gg/avalanche/stake/sjoe) which have a yearly APR of 11%, quite high!
The APR is the Annual Percentage Rate, which is on average the expected benefit you will get from staking your tokens. If you are a revolut user, it's the same as having a savings account
 with the little difference of compounding, TL;DR: Your expected benefit is fixed with APR, while the benefit grows automatically with APY.

All the transactions in the networks are public: not anonymous but "pseudonymous". Meaning any person can see all the transactions in the network, from the addressess of the wallets, contracts, etc.
I will share the transactions I've made with you dear reader so you can see them aswell.

Before moving anything, I claim my 38.5 USDC token as a reward of having used that coin:
https://snowscan.xyz/tx/0x39b656ab5d7831e8652318094573164a5c0e39acf0754745003cb5ea70006fd8

Then I unstake all my joes thanks to this transaction:
https://snowtrace.io/tx/0x91778a7fde5fa0a2d80661f355d080491fdeb7795e25dea966bd7dc0b348ee5b

## Step 2: Token swap

I am aiming to swap the JOE token to USDC, the first operation needed to acheive this swap is the token validation.
The DEX's smart contract (in this case traderjoe) needs permission to "spend" my tokens, this is a one-time operation per token-contract pair.
The approval transaction doesn't transfer funds: it just updates the blockchain to allow the smart contract to use a specific amount of your tokens!
https://snowtrace.io/tx/0x1ff84284be8e142b0096a9c9f0d191a6e37cb7d5630c09ca185c980a592cc1c3

Then we do the actual token swap in the following transaction:
https://snowtrace.io/tx/0x702e0485196a8af627e9d9c54659006de2dcd38afbb87873d8f1460c7656c3aa

## Step 3: USDC from the Avalanche network to USDC in Ethereum network

This is the funny operation
https://snowtrace.io/tx/0x184afe58fa76fa7d133d8ff56beed2b24890ba525e8cb50d72f9a385258f9013

If we tear down this operation, we can see 6 sub-operations:

1. From 0xCFe13...93D497 To 0xf3E6B...DE8447 For 169.889303
2. From 0xf3E6B...DE8447 To 0x68e21...e167E9 For 1.486531
3. From 0xf3E6B...DE8447 To Socketgateway For 168.402772
4. From Socketgateway To 0xc91E5...34f7FC For 7.961922
5. From Socketgateway To 0x420F5...E272b8 For 160.44085
6. From 0x420F5...E272b8 To Null: 0x000…000 For 160.44085

The first operation is from my origin network (Avalanche) wallet, to the bridge contract, the initial step for bridging.  
The second operation amount is the costs for bridging fees  
The third operation is to send the rest of USDCs into my destination nework (Ethereum)  
The fourth operation is for the intermediate contract (in this case the celer bridge) to fulfill the bridging transaction. (There are lots of other bridges, like stargate, use the best to your convenience!)  
The fifth operation is the rest of the amount into the destination network into a proxy destination that ensures the delivery of the token.  
The sixth operation is interesting, it represents the burning of the tokens in the origin network once the desination network has confirmed and validated they've been received.  

This last one it's like piping to `/dev/null`, this null address is specifically generated to allow to burn tokens, or used as a placeholder for tokens that didn't previously exist in the network.

And of course, we can see the transaction in the Ethereum network where the tokens have been emited from this null address.  
Notice that this service (etherscan) scans the whole Ethereum network.
https://etherscan.io/tx/0x177e69ac641e6177e64cf07243e6e7671c796f3055a855c8384143cb56c6e1ed

That's it for today! Soon will become a landlord :D

Enjoy your night!
