import BigNumber from 'bignumber.js';
import { plainToClass as plainToInstance } from 'class-transformer';
import {
  AllowanceType,
  CreateTokenClassDto,
  createValidDTO,
  FetchAllowancesDto,
  GrantAllowanceDto,
  TokenInstanceQueryKey
} from '@gala-chain/api';
import { CRC_TOKEN_CLASS_DEF, CRC_TOKEN_CLASS_KEY } from './common';
import { TOKEN_CONTRACT } from './galachain-token-contract';
import { CONFIG } from './config';

export async function setupChain() {
  // Check if the token exists
  const existing = await TOKEN_CONTRACT.FetchTokenClass(CRC_TOKEN_CLASS_KEY);
  if (!existing) {
    // if not, define it
    const dto = await createValidDTO<CreateTokenClassDto>(CreateTokenClassDto, CRC_TOKEN_CLASS_DEF);
    await TOKEN_CONTRACT.CreateTokenClass(dto.signed(CONFIG.ADMIN_SIGNING_KEY));
  }

  // Check if a mint allowance for the admin wallet is present
  const { Data: allowances } = await TOKEN_CONTRACT.FetchAllowances(
    await createValidDTO<FetchAllowancesDto>(FetchAllowancesDto, {
      grantedTo: CONFIG.ADMIN_IDENTITY,
      allowanceType: AllowanceType.Mint,
      ...CRC_TOKEN_CLASS_KEY,
      instance: '0'
    })
  );
  if (!allowances?.results.length) {
    // if not, grant it
    const dto: GrantAllowanceDto = await createValidDTO<GrantAllowanceDto>(GrantAllowanceDto, {
      tokenInstance: plainToInstance(TokenInstanceQueryKey, {
        ...CRC_TOKEN_CLASS_KEY,
        instance: new BigNumber(0)
      }),
      allowanceType: AllowanceType.Mint,
      uses: new BigNumber(Number.MAX_SAFE_INTEGER),
      quantities: [
        {
          quantity: new BigNumber(Number.MAX_SAFE_INTEGER),
          user: CONFIG.ADMIN_IDENTITY
        }
      ]
    });

    await TOKEN_CONTRACT.GrantAllowance(dto.signed(CONFIG.ADMIN_SIGNING_KEY));
  }
}
