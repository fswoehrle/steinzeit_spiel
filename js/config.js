const COLS = 10;
const ROWS = 6;
const TOTAL_FIELDS = COLS * ROWS;

const MAX_POWER = 100;
const MAX_HEALTH = 10;
const TENT_SYMBOL = '🏕️';
const BASE_MAX_TENTS = 2;
const TIGER_SYMBOL = '🐅';
const RESOURCE_RESPAWN_MS = 20000;
const TIGER_SPAWN_MS = 60000;

const MOUNTAIN_SYMBOL = '⛰️';
const ORE_SYMBOLS = ['🥇', '🥈', '🔶', '⬛'];
const MOUNTAIN_POSITIONS = [7, 8, 9, 17, 18, 19, 27, 28, 29];
const ORE_RESPAWN_MS = 15000;
const TIGER_RESPAWN_AFTER_VANISH_MS = 60000;
const TIGER_RESPAWN_AFTER_HUNT_MS = 120000;
const TIGER_LIFETIME_MS = 15000;
const TIGER_MOVE_MS = 1000;

let board = Array(TOTAL_FIELDS).fill('');
let playerIndex = 0;
let isBusy = false;
let isGameOver = false;
let hasTool = false;
let toolCount = 0;
let maxTents = BASE_MAX_TENTS;

let stats = { power: 100, health: 10 };
let inventory = { '🌳': 0, '🪨': 0, '🦣': 0, '🦴': 0, '🥇': 0, '🥈': 0, '🔶': 0, '⬛': 0, '🐅': 0 };

let idleTimer = null;
let tentHealTimer = null;
let healthRegenTimer = null;

let tigerIndex = -1;
let tigerMoveTimer = null;
let tigerLifeTimer = null;
let tigerSpawnInterval = null;
let tigerRespawnTimer = null;
let oreRespawnTimer = null;

const resourceSymbols = ['🌳', '🪨', '🦣', '🦴'];

const idMapping = {
    '🌳': 'count-tree',
    '🪨': 'count-stone',
    '🦣': 'count-mammoth',
    '🦴': 'count-bone',
    '🥇': 'count-gold',
    '🥈': 'count-silver',
    '🔶': 'count-copper',
    '⬛': 'count-coal',
    '🐅': 'count-tiger'
};
