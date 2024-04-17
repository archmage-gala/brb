import dotenv from 'dotenv';
import * as z from 'zod';

dotenv.config();

const ConfigSchema = z.object({
  PORT: z.coerce.number(),
  // Pot starts at this balance
  POT_START: z.coerce.number().default(10_000),
  // Pot starts at this chance to win
  CHANCE_START: z.coerce.number().default(0.001),
  // What amount of the attempt gets added to the pot
  POT_FACTOR: z.coerce.number().default(0.1),
  // How many random numbers to generate
  RANDOM_COUNT: z.coerce.number().default(1_000),
  // Transfer or Mint/Burn mode
  BURN_MODE: z.coerce.boolean().default(true),
  // fablo-rest API endpoint
  GALACHAIN_REST_URI: z.string(),
  // admin wallet configuration
  ADMIN_IDENTITY: z.string(),
  ADMIN_KEY: z.string(),
  ADMIN_SECRET: z.string(),
  ADMIN_SIGNING_KEY: z.string(),
});

export const CONFIG = ConfigSchema.parse(process.env);
