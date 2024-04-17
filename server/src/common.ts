import BigNumber from 'bignumber.js';
import { plainToClass } from 'class-transformer';
import { RestApiClientBuilder } from '@gala-chain/client';
import { TokenClassKey } from '@gala-chain/api';
import { CONFIG } from './config';

export const CRC_TOKEN_CLASS_KEY = plainToClass(TokenClassKey, {
  collection: 'ChickenRatCoin',
  category: 'Unit',
  type: 'none',
  additionalKey: 'none'
});

export const CRC_TOKEN_CLASS_DEF = {
  decimals: 8,
  tokenClass: CRC_TOKEN_CLASS_KEY,
  name: 'Chicken Rat Coin',
  symbol: 'CRC',
  description: 'CRC is the token that powers the BRB',
  isNonFungible: false,
  image: 'https://app.gala.games/_nuxt/img/gala-logo_horizontal_white.8b0409c.png',
  maxSupply: new BigNumber(Number.MAX_SAFE_INTEGER)
};

export const clientBuilder = new RestApiClientBuilder(
  CONFIG.GALACHAIN_REST_URI,
  'CuratorOrg',
  { adminKey: CONFIG.ADMIN_KEY, adminSecret: CONFIG.ADMIN_SECRET },
  {
    channels: [
      {
        pathFragment: 'product',
        channelName: 'product-channel',
        contracts: [
          {
            pathFragment: 'public-key-contract',
            chaincodeName: 'basic-product',
            contractName: 'GalaChainToken'
          },
          {
            pathFragment: 'public-key-contract',
            chaincodeName: 'basic-product',
            contractName: 'PublicKeyContract'
          }
        ]
      }
    ]
  }
);

