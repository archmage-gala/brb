import { BurnTokensDto, createValidDTO, RegisterEthUserDto, signatures } from '@gala-chain/api';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import assert from 'assert';
import { publicKeyContractAPI } from '@gala-chain/client';
import { clientBuilder, CRC_TOKEN_CLASS_KEY } from './common';
import { attemptPot, getPotState, persistPot } from './state';
import { CONFIG } from './config';
import { TOKEN_CONTRACT } from './galachain-token-contract';
import { setupChain } from './setup';

const server = createServer();
const io = new Server(server, { path: '/socket' });

const publicKeyContract = clientBuilder
  .forContract({
    channelName: 'product-channel',
    chaincodeName: 'basic-product',
    contractName: 'PublicKeyContract'
  })
  .extendAPI(publicKeyContractAPI);

io.on('connection', async socket => {

  try {
    // TODO require signature to validate possession of private key
    const publicKey = socket.handshake.query['publicKey'] as string;
    assert(publicKey);

    const ethAddress = signatures.getEthAddress(publicKey);
    const address = `eth|${ethAddress}`; // User's GalaChain address
    socket.emit('welcome', { publicKey, address });

    try {
      // Save the user's wallet
      const dto: RegisterEthUserDto = await createValidDTO<RegisterEthUserDto>(RegisterEthUserDto, {
        publicKey
      });

      await publicKeyContract.RegisterEthUser(dto.signed(CONFIG.ADMIN_SIGNING_KEY));
    } catch {
      // if it fails they're already registered
    }

    // Send the user's current balance to them directly
    async function sendBalance() {
      const balance = await TOKEN_CONTRACT.fetchBalance(CRC_TOKEN_CLASS_KEY, address);
      const quantity = balance ? balance.quantity : '0';
      socket.emit('balance', quantity);
    }

    await sendBalance();
    socket.emit('pot', getPotState());

    // Listen for the user to ask for some tokens, then mint them some
    socket.on('gimme', async () => {
      await TOKEN_CONTRACT.mintToken(CRC_TOKEN_CLASS_KEY, address, '100000', CONFIG.ADMIN_SIGNING_KEY);
      // await mintTokens(adminClient, CRC_TOKEN_CLASS_KEY, address, '100000', adminPrivateKey);
      await sendBalance();
    });

    // Listen for the user to burn some tokens
    socket.on('burn', async ({ burnDto }) => {
      // Parse the client side generated BurnTokens DTO
      const dto = BurnTokensDto.deserialize(BurnTokensDto, burnDto);
      const { Status } = await TOKEN_CONTRACT.submitTransaction('BurnTokens', dto);
      if (Status === 1) {
        // It was successful
        const quantity = dto.tokenInstances[0].quantity;

        // broadcast the burn to everyone
        io.emit('burned', { quantity });
        await sendBalance();

        const { pot } = getPotState();
        assert(pot);

        // run an attempt at the pot
        const attempt = attemptPot(address, quantity);
        persistPot();

        // if it's a winner
        if (attempt.win) {
          // mint them the pot!
          await TOKEN_CONTRACT.mintToken(CRC_TOKEN_CLASS_KEY, address, pot.toString(), CONFIG.ADMIN_SIGNING_KEY);
          await sendBalance();

          // broadcast the winner
          io.emit('winner', { ...attempt, address, pot: pot.toString() });
        }

        // broadcast the new state of the pot
        io.emit('pot', getPotState());
      } else {
        socket.emit('ui-error', { error: 'Failed to burn' });
      }
    });

  } catch (e) {
    console.error(e);
    socket.disconnect(true);
  }
});

void (async () => {
  await setupChain();
  server.listen(CONFIG.PORT, () => console.log(`Listening on ${CONFIG.PORT}`));
})();
