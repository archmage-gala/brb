# Big Red Button

A GalaChain integrated example dApp game for demonstration purposes. 
Players burn CRC tokens every time they press the Big Red Button. 
As CRC tokens are burned, the pot grows and the chance to win increases.
When a player's attempt to win succeeds, they are then minted the pot and the game starts over.

It demonstrates creating "web3" GalaChain wallets that use client-side signing and basic interactions with GalaChain such as minting and burning.
On start up, it also checks whether the CRC token exists and creates it if not (including allowances for it to later use for minting purposes).

It uses:
 - https://github.com/daywiss/provable to generate provably fair random numbers
 - https://github.com/socketio/socket.io for realtime multiplayer communication
 - https://github.com/ethers-io/ethers.js for ethereum wallet support


## Getting Started

### Set up local GalaChain instance

Install the GalaChain CLI. More detailed instructions: https://github.com/GalaChain/sdk/blob/main/docs/getting-started.md 
   
    $ npm i -g @gala-chain/cli
    $ galachain init brbchain
    $ cd brbchain/
    $ npm i
    $ sudo npm run network:up

### Install dependencies

Clone the repository and install npm packages

    $ git clone https://github.com/archmage-gala/brb
    $ cd brb/
    $ npm i

Create an environment file, the defaults should work fine

    $ cp .env.example .env

## Start the Server

    $ cd server/
    $ npm run start

## Start the Client

    $ cd client/
    $ npm run start

Navigate to http://localhost:4200, click the $GIMME button to get some CRC, then start clicking the Big Red Button!
