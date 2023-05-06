const HAND_MAX = 6;

let PHASE = {
  DRAW: 'DRAW',
  MAIN: 'MAIN',
  BATTLE: 'BATTLE',
  END: 'END'
};

let LOCATION = {
  ONFIELD: 'ONFIELD',
  FZONE: 'FZONE',
  MZONE: 'MZONE',
  SZONE: 'SZONE',
  GRAVEYARD: 'GRAVEYARD',
  BANNISHED: 'BANNISHED',
  DECK: 'DECK',
  HAND: 'HAND'
};

let CARD_TYPE = {
  MONSTER: 'MONSTER',
  SPELL: 'SPELL'
};

let CARD_POS = {
  ATTACK: 'ATTACK',
  DEFENSE: 'DEFENSE',
  FACEUP: 'FACEUP',
  FACEDOWN: 'FACEDOWN'
};

let CARD_ELEMENT = {
  DARK: 'DARK',
  LIGHT: 'LIGHT',
  EARTH: 'EARTH',
  WIND: 'WIND',
  FIRE: 'FIRE',
  WATER: 'WATER',
  DIVINE: 'DIVINE'
};

let MONSTER_CARD_RACE = {
  AQUA: 'AQUA',
  BEAST: 'BEAST',
  BEAST_WARRIOR: 'BEAST_WARRIOR',
  DINOSAUR: 'DINOSAUR',
  FAIRY: 'FAIRY',
  FIEND: 'FIEND',
  FISH: 'FISH',
  INSECT: 'INSECT',
  MACHINE: 'MACHINE',
  PLANT: 'PLANT',
  PSYCHIC: 'PSYCHIC',
  PYRO: 'PYRO',
  REPTILE: 'REPTILE',
  SEASERPENT: 'SEASERPENT',
  SPELLCASTER: 'SPELLCASTER',
  THUNDER: 'THUNDER',
  WARRIOR: 'WARRIOR',
  WINGEDBEAST: 'WINGEDBEAST',
  ZOMBIE: 'ZOMBIE',
  WYRM: 'WYRM',
  DRAGON: 'DRAGON',
  DIVINEBEAST: 'DIVINEBEAST',
  CREATORGOD: 'CREATORGOD',
  CYBERSE: 'CYBERSE'
};

let SPELL_CARD_MODE = {
  ACTIVATE: 'ACTIVATE',
  TRIGGER: 'TRIGGER'
};

let SPELL_CARD_NATURE = {
  NORMAL: 'NORMAL',
  CONTINUOUS: 'CONTINUOUS'
};

let EFFECT_TARGET_TYPE = {
  SINGLE: 'SINGLE',
  FIELD: 'FIELD',
  NONE: 'NONE'
};

export { HAND_MAX };
export { PHASE };
export { LOCATION };
export { CARD_TYPE };
export { CARD_POS }; 
export { CARD_ELEMENT };
export { MONSTER_CARD_RACE };
export { SPELL_CARD_MODE };
export { SPELL_CARD_NATURE };
export { EFFECT_TARGET_TYPE };