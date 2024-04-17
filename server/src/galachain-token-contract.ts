import { ChainClient, commonContractAPI } from '@gala-chain/client';
import {
  ChainCallDTO,
  CreateTokenClassDto,
  createValidDTO,
  FetchAllowancesDto,
  FetchAllowancesResponse,
  FetchBalancesDto,
  FetchTokenClassesDto,
  GalaChainResponse,
  GrantAllowanceDto,
  MintTokenDto,
  TokenAllowance,
  TokenBalance,
  TokenClass,
  TokenClassKey,
  TokenInstanceKey
} from '@gala-chain/api';
import { plainToClass } from 'class-transformer';
import BigNumber from 'bignumber.js';
import { clientBuilder } from './common';

/**
 * Typed wrapper function for chain reads
 * @param client
 * @param name
 */
function chainEvaluate<T extends ChainCallDTO, U>(client: ChainClient, name: string) {
  return (dto: T) => {
    return client.evaluateTransaction(name, dto) as Promise<GalaChainResponse<U>>;
  }
}

/**
 * Typed wrapper for chain writes
 * @param client
 * @param name
 */
function chainSubmit<T extends ChainCallDTO, U>(client: ChainClient, name: string) {
  return (dto: T) => {
    return client.submitTransaction(name, dto) as Promise<GalaChainResponse<U>>;
  }
}

export const galaChainTokenContractAPI = (client: ChainClient) => ({
  ...commonContractAPI(client),
  FetchTokenClasses: chainEvaluate<FetchTokenClassesDto, TokenClass[]>(client, 'FetchTokenClasses'),
  CreateTokenClass: chainSubmit<CreateTokenClassDto, TokenClassKey>(client, 'CreateTokenClass'),
  FetchBalances: chainEvaluate<FetchBalancesDto, TokenBalance[]>(client, 'FetchBalances'),
  FetchAllowances: chainEvaluate<FetchAllowancesDto, FetchAllowancesResponse>(client, 'FetchAllowances'),
  MintToken: chainSubmit<MintTokenDto, TokenInstanceKey[]>(client, 'MintToken'),
  GrantAllowance: chainSubmit<GrantAllowanceDto, TokenAllowance[]>(client, 'GrantAllowance'),
  async FetchTokenClass(tokenClassKey: TokenClassKey) {
    const dto: FetchTokenClassesDto = await createValidDTO<FetchTokenClassesDto>(FetchTokenClassesDto, {
      tokenClasses: [plainToClass(TokenClassKey, tokenClassKey)]
    });
    return this.FetchTokenClasses(dto).then(({ Data }) => Data?.[0]);
  },
  async mintToken(tokenClass: TokenClassKey, owner: string, quantity: string, signingKey: string) {
    const dto: MintTokenDto = await createValidDTO<MintTokenDto>(MintTokenDto, {
      tokenClass,
      owner,
      quantity: new BigNumber(quantity)
    });

    return this.MintToken(dto.signed(signingKey));
  },
  async fetchBalance(tokenClass: TokenClassKey, owner: string) {
    const dto: FetchBalancesDto = await createValidDTO<FetchBalancesDto>(FetchBalancesDto, {
      ...tokenClass,
      owner
    });
    return this.FetchBalances(dto).then(({ Data }) => Data?.[0] as unknown as { quantity: string });
  }
});

export const TOKEN_CONTRACT = clientBuilder
  .forContract({
    channelName: 'product-channel',
    chaincodeName: 'basic-product',
    contractName: 'GalaChainToken'
  })
  .extendAPI(galaChainTokenContractAPI);

