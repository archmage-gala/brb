import assert from 'assert';
import BigNumber from 'bignumber.js';
import Provable from 'provable';
import fs from 'fs';
import { CONFIG } from './config';
import * as path from 'path';

interface AttemptHistory {
  address: string;
  quantity: string;
}

interface StoredState {
  id: string; // the random run
  seed: string; // the random seed DO NOT PUBLISH

  // These are stored for historical reasons
  randomCount: number; // The number of random numbers in the set
  potStart: number; // the historical pot starting size
  chanceStart: number; // the historical chance starting point
  potFactor: number; // the amount of the burn that gets added to the pot

  // historical attempts, this is all the information we need to deterministically rebuild history
  history: AttemptHistory[];

  // final outcome for cross validation
  endPot?: string;
  endChance?: string;
  startDate: string;
  endDate?: string;
  winner?: string;
}

let potStart: number;
let chanceStart: number;
let potFactor: number;
let randomCount: number;

let random: any;
let pot: BigNumber | undefined;
let chance: BigNumber | undefined;
let history: AttemptHistory[] = [];

let startDate: Date;
let endDate: Date | undefined;
let endPot: BigNumber | undefined;
let endChance: BigNumber | undefined;
let winner: string | undefined;

// pro-tip: use a real database.
const HISTORY_PATH = './state/history';
if (!fs.existsSync(HISTORY_PATH)) {
  fs.mkdirSync(HISTORY_PATH, { recursive: true });
}

const CURRENT_PATH = './state/current.json';
const savedState = fs.existsSync(CURRENT_PATH)
  ? (JSON.parse(fs.readFileSync(CURRENT_PATH, 'utf8')) as StoredState)
  : undefined;

createNewPot(savedState);

// Creates or loads pot state
export function createNewPot(state?: StoredState) {
  let history: AttemptHistory[];

  if (state) {
    // Load existing pot state

    // Must be seeded with original starting parameters in order to
    // deterministically rebuild the correct current state
    potStart = state.potStart;
    chanceStart = state.chanceStart;
    potFactor = state.potFactor;
    randomCount = state.randomCount;
    history = state.history;

    startDate = new Date(state.startDate);
    endDate = state.endDate ? new Date(state.endDate) : undefined;
    endPot = state.endPot ? new BigNumber(state.endPot) : undefined;
    endChance = state.endChance ? new BigNumber(state.endChance) : undefined;
    winner = state.winner;

    random = Provable({
      count: state.randomCount,
      id: state.id,
      seed: state.seed
    });
  } else {
    // Create new pot state
    potStart = CONFIG.POT_START;
    chanceStart = CONFIG.CHANCE_START;
    potFactor = CONFIG.POT_FACTOR;
    randomCount = CONFIG.RANDOM_COUNT;

    startDate = new Date();
    endDate = undefined;
    endPot = undefined;
    endChance = undefined;
    winner = undefined;

    history = [];
    random = Provable({ count: randomCount });

    persistPot();
  }

  pot = new BigNumber(potStart);
  chance = new BigNumber(chanceStart);

  // replay all history for this pot
  for (const { address, quantity } of history) {
    attemptPot(address, new BigNumber(quantity));
  }
}

/**
 * Calculate a chance multiplier based on the current attempt burn amount
 * Amount burned => Current chance multiplier
 * 1 => 1.01x
 * 10 => 1.02x
 * 100 => 1.03x
 * 1000 => 1.04x
 * 10000 => 1.05x
 * and so on
 */
export function calcMultiplierFromBurnedAmount(quantity: BigNumber) {
  // Get number of digits (1, 2, 3, 4, etc)
  const digits = quantity.abs().integerValue(BigNumber.ROUND_DOWN).toString().length;
  // Move factor to hundredths place and retain current chance (1.01, 1.02, 1.03, 1.04, etc)
  return digits / 100 + 1;
}

export function getPotState() {
  return { pot, chance };
}

// Run an attempt at the pot. Increments the pot, increments the chance, checks for a win and generates history
export function attemptPot(address: string, quantity: BigNumber) {
  const multiplier = calcMultiplierFromBurnedAmount(quantity);
  const potAddition = quantity.multipliedBy(potFactor);

  assert(pot);
  assert(chance);

  pot = pot.plus(potAddition);
  chance = chance.multipliedBy(multiplier);

  const hash = random.next();
  const win = Provable.toBool(hash, chance);

  history.push({ address, quantity: quantity.toString() });

  if (win) {
    winner = address;
    endPot = pot;
    endChance = chance;

    finishPot();
  }

  return { win, hash, multiplier, potAddition };
}

function getPotStateForStorage(): StoredState {
  const { id, seed } = random.state();
  return {
    id,
    seed,
    randomCount,
    potStart,
    chanceStart,
    potFactor,
    history,
    startDate: startDate.toISOString(),
    endDate: endDate?.toISOString(),
    endPot: endPot?.toString(),
    endChance: endChance?.toString(),
    winner
  };
}

// Saves the current running pot state
export function persistPot() {
  fs.writeFileSync(CURRENT_PATH, JSON.stringify(getPotStateForStorage(), null, 2));
}

// Saves a historical copy of pot state and starts a new one
export function finishPot() {
  const state = getPotStateForStorage();
  fs.writeFileSync(
    path.join(HISTORY_PATH, `/${state.startDate.replace(/:/gi, '')}.${state.id}.json`),
    JSON.stringify(state, null, 2)
  );
  fs.unlinkSync(CURRENT_PATH);
  createNewPot();
}
