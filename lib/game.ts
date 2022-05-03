import { proxy } from 'valtio';

const TILE_COUNT = 5;

// generate every possible ordering for TILE_COUNT tiles
const EVERY_POSSIBLE_ORDER = permute(Array.from(Array(TILE_COUNT).keys()));
function permute(input: number[]) {
  if (input.length <= 1) {
    return [input];
  }
  const result = [];
  for (let i = 0; i < input.length; i++) {
    const element = input[i];
    const rest = input.slice(0, i).concat(input.slice(i + 1));
    for (const permutation of permute(rest)) {
      result.push([element].concat(permutation));
    }
  }
  return result;
}
console.log(EVERY_POSSIBLE_ORDER.length + ' possible orders');

type TileRule =
  | {
      type: 'order';
      otherTile: number;
      ordering: 'before' | 'after';
    }
  | {
      type: 'proximity';
      otherTile: number;
      proximity: number;
    }
  | {
      type: 'position';
      position: number;
    };

type GameState = {
  tileOrder: number[];
  tileRules: TileRule[][];
};

function shuffleArray<T>(array: T[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function createInitialScenario() {
  const targetOrder = shuffleArray(Array.from(Array(TILE_COUNT).keys()));
  console.debug('target order', targetOrder);
  const rules: TileRule[][] = new Array(TILE_COUNT).fill(null).map(() => []);
  let ruleWasAdded = false;
  // keep adding rules until there's only 1 valid configuration
  do {
    ruleWasAdded = addRandomValidRule(targetOrder, rules);
  } while (!ruleWasAdded || areThereMultipleWinningConfigurations(rules));

  // shuffle the order of the tiles
  const tileOrder = shuffleArray(targetOrder);
  // return the initial gamestate
  return {
    tileOrder,
    tileRules: rules,
  };
}

function isWinningConfiguration(gameState: GameState) {
  const tileOrder = gameState.tileOrder;
  const tileRules = gameState.tileRules;
  for (let i = 0; i < tileRules.length; i++) {
    for (const rule of tileRules[i]) {
      if (!ruleMatches(rule, tileOrder, i)) {
        return false;
      }
    }
  }
  return true;
}

export function ruleMatches(
  rule: TileRule,
  tileOrder: readonly number[],
  tileNumber: number,
): boolean {
  switch (rule.type) {
    case 'order':
      if (rule.ordering === 'before') {
        if (tileOrder.indexOf(tileNumber) > tileOrder.indexOf(rule.otherTile)) {
          return false;
        }
      } else {
        if (tileOrder.indexOf(tileNumber) < tileOrder.indexOf(rule.otherTile)) {
          return false;
        }
      }
      break;
    case 'proximity':
      if (
        Math.abs(
          tileOrder.indexOf(tileNumber) - tileOrder.indexOf(rule.otherTile),
        ) !== rule.proximity
      ) {
        return false;
      }
      break;
    case 'position':
      if (tileOrder.indexOf(tileNumber) !== rule.position) {
        return false;
      }
      break;
  }
  return true;
}

export function getRuleMatchState(
  rules: readonly TileRule[],
  tileOrder: readonly number[],
  tileNumber: number,
) {
  let matchCount = 0;
  for (const rule of rules) {
    if (ruleMatches(rule, tileOrder, tileNumber)) {
      matchCount++;
    }
  }
  if (matchCount === rules.length) return 'match';
  if (matchCount === 0) return 'no-match';
  return 'partial-match';
}

function areThereMultipleWinningConfigurations(rules: TileRule[][]) {
  let matching = 0;
  for (const possibleOrder of EVERY_POSSIBLE_ORDER) {
    if (
      isWinningConfiguration({
        tileRules: rules,
        tileOrder: possibleOrder,
      })
    ) {
      matching++;
    }
    if (matching > 1) {
      return true;
    }
  }
  if (matching === 0) {
    console.error('No winning configurations found', rules);
    throw new Error('No winning configurations found');
  }
  return false;
}

function addRandomValidRule(
  tileOrder: number[],
  tileRules: TileRule[][],
): boolean {
  const ruleKind = ['order', 'proximity', 'position'][
    Math.floor(Math.random() * 3)
  ];
  switch (ruleKind) {
    case 'order':
      return addRandomValidOrderRule(tileOrder, tileRules);
    case 'proximity':
      return addRandomValidProximityRule(tileOrder, tileRules);
    case 'position':
      return addRandomValidPositionRule(tileOrder, tileRules);
  }
  return false;
}

function addRandomValidOrderRule(
  tileOrder: number[],
  tileRules: TileRule[][],
): boolean {
  // choose two random tiles which don't already have an order rule
  let randomTile,
    randomOtherTile,
    tries = 0;
  do {
    tries++;
    randomTile = Math.floor(Math.random() * tileOrder.length);
    do {
      randomOtherTile = Math.floor(Math.random() * tileOrder.length);
    } while (randomTile === randomOtherTile);
  } while (
    tries < 10 &&
    tileRules[randomTile].find(
      (rule) => rule.type === 'order' && rule.otherTile === randomOtherTile,
    )
  );

  if (tries >= 10) {
    return false;
  }

  // write the rule to both tiles' rulesets
  const otherIsAfter =
    tileOrder.indexOf(randomTile) < tileOrder.indexOf(randomOtherTile);
  tileRules[randomTile].push({
    type: 'order',
    otherTile: randomOtherTile,
    ordering: otherIsAfter ? 'before' : 'after',
  });
  tileRules[randomOtherTile].push({
    type: 'order',
    otherTile: randomTile,
    ordering: otherIsAfter ? 'after' : 'before',
  });

  return true;
}

function addRandomValidProximityRule(
  tileOrder: number[],
  tileRules: TileRule[][],
): boolean {
  // choose two random tiles which don't already have a proximity rule
  let randomTile,
    randomOtherTile,
    tries = 0;
  do {
    tries++;
    randomTile = Math.floor(Math.random() * tileOrder.length);
    do {
      randomOtherTile = Math.floor(Math.random() * tileOrder.length);
    } while (randomTile === randomOtherTile);
  } while (
    tries < 10 &&
    tileRules[randomTile].find(
      (rule) => rule.type === 'proximity' && rule.otherTile === randomOtherTile,
    )
  );

  if (tries >= 10) {
    return false;
  }

  // write the rule to both tiles' rulesets
  const proximity = Math.abs(
    tileOrder.indexOf(randomTile) - tileOrder.indexOf(randomOtherTile),
  );
  tileRules[randomTile].push({
    type: 'proximity',
    otherTile: randomOtherTile,
    proximity,
  });
  tileRules[randomOtherTile].push({
    type: 'proximity',
    otherTile: randomTile,
    proximity,
  });

  return true;
}

function addRandomValidPositionRule(
  tileOrder: number[],
  tileRules: TileRule[][],
): boolean {
  // if all rules already have a position, there's no more valid rules to add
  if (
    tileRules.every((ruleset) =>
      ruleset.find((rule) => rule.type === 'position'),
    )
  ) {
    return false;
  }

  // find a ruleset without a position
  let randomTile;
  do {
    randomTile = Math.floor(Math.random() * tileOrder.length);
  } while (tileRules[randomTile].find((rule) => rule.type === 'position'));

  // add the position rule
  tileRules[randomTile].push({
    type: 'position',
    position: tileOrder.indexOf(randomTile),
  });

  return true;
}

export const gameState = proxy(createInitialScenario());
