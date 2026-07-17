function getRandomFreeFieldIndex(excludePlayer = false) {
    const free = [];
    for (let i = 0; i < TOTAL_FIELDS; i++) {
        if (board[i] !== '') continue;
        if (excludePlayer && i === playerIndex) continue;
        free.push(i);
    }
    if (free.length === 0) return -1;
    return free[Math.floor(Math.random() * free.length)];
}

function scheduleResourceRespawn(symbol) {
    setTimeout(() => {
        if (isGameOver) return;
        const idx = getRandomFreeFieldIndex(true);
        if (idx === -1) return;
        board[idx] = symbol;
        renderGrid();
    }, RESOURCE_RESPAWN_MS);
}

function scheduleOreRespawn() {
    clearTimeout(oreRespawnTimer);

    oreRespawnTimer = setTimeout(() => {
        if (isGameOver) return;

        const freeMountainFields = MOUNTAIN_POSITIONS.filter(index => board[index] === MOUNTAIN_SYMBOL);
        if (freeMountainFields.length === 0) return;

        const oreIndex = freeMountainFields[Math.floor(Math.random() * freeMountainFields.length)];
        const oreSymbol = ORE_SYMBOLS[Math.floor(Math.random() * ORE_SYMBOLS.length)];
        board[oreIndex] = oreSymbol;
        updateStatsDisplay('Neuer Rohstoff im Berg erschienen');
        renderGrid();
    }, ORE_RESPAWN_MS);
}

function stopAllRegenTimers() {
    clearTimeout(idleTimer);
    clearTimeout(tentHealTimer);
    clearTimeout(healthRegenTimer);
    healthRegenTimer = null;
}

function startHealthRegenTimer() {
    if (isGameOver) return;
    if (stats.health >= MAX_HEALTH) {
        clearTimeout(healthRegenTimer);
        healthRegenTimer = null;
        return;
    }

    if (healthRegenTimer !== null) return;

    healthRegenTimer = setTimeout(() => {
        healthRegenTimer = null;
        if (isGameOver) return;

        if (stats.health < MAX_HEALTH) {
            stats.health += 1;
            updateStatsDisplay('Regeneration (+1 Gesundheit)');
            renderGrid();
            startHealthRegenTimer();
        }
    }, 60000);
}

function updateBuildButtonLabels() {
    document.getElementById('build-tent-btn').innerText = `🏕️ Lager erstellen (3 🌳 + 4 🦣) [${countTentsOnBoard()}/${maxTents}]`;
}

function startIdleTimer() {
    clearTimeout(idleTimer);

    idleTimer = setTimeout(() => {
        if (isGameOver || isBusy) return;

        if (board[playerIndex] === '') {
            stats.power += 1;
            stats.health += 1;
            updateStatsDisplay('Regeneration (+1 Kraft, +1 Gesundheit)');
            renderGrid();
            startIdleTimer();
        }
    }, 5000);
}

function startTentHealTimer() {
    clearTimeout(tentHealTimer);

    tentHealTimer = setTimeout(() => {
        if (isGameOver || isBusy) return;

        if (board[playerIndex] === TENT_SYMBOL) {
            stats.health += 1;
            updateStatsDisplay('Im Lager: +1 Gesundheit');
            renderGrid();
            startTentHealTimer();
        }
    }, 3000);
}

function buildTool() {
    if (isGameOver || isBusy) return;

    if (hasTool) {
        updateStatsDisplay('Werkzeug bereits vorhanden');
        return;
    }

    if (inventory['🪨'] < 5 || inventory['🦴'] < 5) {
        updateStatsDisplay('Nicht genug: 5 🪨 und 5 🦴 benötigt');
        return;
    }

    inventory['🪨'] -= 5;
    inventory['🦴'] -= 5;
    document.getElementById(idMapping['🪨']).innerText = inventory['🪨'];
    document.getElementById(idMapping['🦴']).innerText = inventory['🦴'];

    hasTool = true;
    toolCount = 1;
    updateStatsDisplay('Werkzeug erstellt! Erz am Berg abbauen möglich');
}

function upgradeTentLimit() {
    if (isGameOver || isBusy) return;

    if (inventory['🥇'] >= 1) {
        inventory['🥇'] -= 1;
        document.getElementById(idMapping['🥇']).innerText = inventory['🥇'];
    } else if (inventory['🥈'] >= 5) {
        inventory['🥈'] -= 5;
        document.getElementById(idMapping['🥈']).innerText = inventory['🥈'];
    } else if (inventory['🔶'] >= 10) {
        inventory['🔶'] -= 10;
        document.getElementById(idMapping['🔶']).innerText = inventory['🔶'];
    } else {
        updateStatsDisplay('Nicht genug: 1 🥇 oder 5 🥈 oder 10 🔶 benötigt');
        return;
    }

    maxTents += 1;
    updateBuildButtonLabels();
    updateStatsDisplay(`Lagerlimit erhoeht auf ${maxTents}`);
}

function countTentsOnBoard() {
    return board.filter(cell => cell === TENT_SYMBOL).length;
}

function buildTent() {
    if (isGameOver || isBusy) return;

    if (countTentsOnBoard() >= maxTents) {
        updateStatsDisplay(`Maximal ${maxTents} Lager erlaubt`);
        return;
    }

    if (board[playerIndex] !== '') {
        updateStatsDisplay('Lagerbau nur auf leerem Feld moeglich');
        return;
    }

    if (inventory['🌳'] < 3 || inventory['🦣'] < 4) {
        updateStatsDisplay('Nicht genug Vorrat: 3 🌳 und 4 🦣 benoetigt');
        return;
    }

    inventory['🌳'] -= 3;
    inventory['🦣'] -= 4;
    document.getElementById(idMapping['🌳']).innerText = inventory['🌳'];
    document.getElementById(idMapping['🦣']).innerText = inventory['🦣'];

    board[playerIndex] = TENT_SYMBOL;

    updateBuildButtonLabels();
    updateStatsDisplay(`Lager erstellt (${countTentsOnBoard()}/${maxTents})`);
    renderGrid();

    stopAllRegenTimers();
    startTentHealTimer();
}

function movePlayer(dRow, dCol) {
    if (isBusy || isGameOver) return;

    const currentRow = Math.floor(playerIndex / COLS);
    const currentCol = playerIndex % COLS;

    const newRow = currentRow + dRow;
    const newCol = currentCol + dCol;

    if (newRow < 0 || newRow >= ROWS || newCol < 0 || newCol >= COLS) return;

    const newIndex = newRow * COLS + newCol;
    const target = board[newIndex];

    stopAllRegenTimers();

    if (target === '' || target === TENT_SYMBOL) {
        playerIndex = newIndex;
        updateStatsDisplay(target === TENT_SYMBOL ? 'Im Lager angekommen' : 'Bewegt');
        renderGrid();

        if (tigerAttackIfOnPlayer()) {
            renderGrid();
            return;
        }

        if (board[playerIndex] === TENT_SYMBOL) startTentHealTimer();
        else startIdleTimer();

        return;
    }

    if (target === TIGER_SYMBOL) {
        playerIndex = newIndex;

        if (stats.health === MAX_HEALTH && huntTiger()) {
            renderGrid();

            if (board[playerIndex] === TENT_SYMBOL) startTentHealTimer();
            else startIdleTimer();
            return;
        }

        tigerAttackIfOnPlayer();
        renderGrid();

        if (!isGameOver) {
            if (board[playerIndex] === TENT_SYMBOL) startTentHealTimer();
            else startIdleTimer();
        }
        return;
    }

    if (target === MOUNTAIN_SYMBOL) {
        updateStatsDisplay('Berg: nicht begehbar');
        startIdleTimer();
        return;
    }

    if (ORE_SYMBOLS.includes(target)) {
        if (!hasTool) {
            updateStatsDisplay('Werkzeug benötigt! (5 🪨 + 5 🦴)');
            startIdleTimer();
            return;
        }
        isBusy = true;
        playerIndex = newIndex;
        updateStatsDisplay(`Abbauen ${target}... (5s)`);
        renderGrid();

        setTimeout(() => {
            if (isGameOver) return;
            inventory[target] += 1;
            document.getElementById(idMapping[target]).innerText = inventory[target];
            board[newIndex] = MOUNTAIN_SYMBOL;
            isBusy = false;
            scheduleOreRespawn();
            updateStatsDisplay(`Abgebaut: ${target}`);
            renderGrid();
            if (!isGameOver) {
                if (tigerAttackIfOnPlayer()) { renderGrid(); return; }
                startIdleTimer();
            }
        }, 5000);
        return;
    }

    let waitMs = 2000;
    if (target === '🦣') waitMs = 5000;

    isBusy = true;
    playerIndex = newIndex;
    updateStatsDisplay(`Sammeln ${target}... (${waitMs / 1000}s)`);
    renderGrid();

    setTimeout(() => {
        if (isGameOver) return;

        inventory[target] += 1;
        document.getElementById(idMapping[target]).innerText = inventory[target];

        if (resourceSymbols.includes(target)) {
            scheduleResourceRespawn(target);
        }

        if (target === '🦣') {
            stats.power -= 5;

            if (Math.random() < 0.5) {
                stats.health -= 4;
                updateStatsDisplay('Mammutkampf: -5 Kraft, -4 Gesundheit');
            } else {
                updateStatsDisplay('Mammutkampf: -5 Kraft, kein Schaden');
            }
        } else {
            updateStatsDisplay(`Gesammelt: ${target}`);
        }

        board[newIndex] = '';

        isBusy = false;
        renderGrid();

        if (!isGameOver) {
            if (tigerAttackIfOnPlayer()) {
                renderGrid();
                return;
            }

            if (board[playerIndex] === TENT_SYMBOL) startTentHealTimer();
            else startIdleTimer();
        }
    }, waitMs);
}

function initGame() {
    board = Array(TOTAL_FIELDS).fill('');
    stats = { power: 100, health: 10 };
    inventory = { '🌳': 0, '🪨': 0, '🦣': 0, '🦴': 0, '🥇': 0, '🥈': 0, '🔶': 0, '⬛': 0, '🐅': 0 };
    isBusy = false;
    isGameOver = false;
    tigerIndex = -1;
    hasTool = false;
    toolCount = 0;
    maxTents = BASE_MAX_TENTS;

    stopAllRegenTimers();
    stopTigerTimers();
    clearTimeout(oreRespawnTimer);

    document.getElementById('game-over').style.display = 'none';
    updateStatsDisplay('Bereit');

    for (let key in inventory) {
        document.getElementById(idMapping[key]).innerText = 0;
    }

    // Berg platzieren (3x3, oben rechts)
    for (const pos of MOUNTAIN_POSITIONS) {
        board[pos] = MOUNTAIN_SYMBOL;
    }
    // Einen zufälligen Rohstoff im Berg platzieren
    const orePos = MOUNTAIN_POSITIONS[Math.floor(Math.random() * MOUNTAIN_POSITIONS.length)];
    board[orePos] = ORE_SYMBOLS[Math.floor(Math.random() * ORE_SYMBOLS.length)];

    // Ressourcen nur auf freien (nicht-Berg) Felder verteilen
    const freePositions = [];
    for (let i = 0; i < TOTAL_FIELDS; i++) {
        if (!MOUNTAIN_POSITIONS.includes(i)) freePositions.push(i);
    }

    let symbols = [];
    for (let i = 0; i < 10; i++) symbols.push('🌳');
    for (let i = 0; i < 5; i++) symbols.push('🪨');
    for (let i = 0; i < 4; i++) symbols.push('🦣');
    for (let i = 0; i < 6; i++) symbols.push('🦴');
    symbols.push('🧍');
    while (symbols.length < freePositions.length) symbols.push('');

    for (let i = symbols.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [symbols[i], symbols[j]] = [symbols[j], symbols[i]];
    }

    for (let i = 0; i < freePositions.length; i++) {
        if (symbols[i] === '🧍') {
            playerIndex = freePositions[i];
            board[freePositions[i]] = '';
        } else {
            board[freePositions[i]] = symbols[i];
        }
    }

    updateBuildButtonLabels();
    renderGrid();
    startIdleTimer();
    startTigerSpawner();
}

document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowUp') movePlayer(-1, 0);
    else if (event.key === 'ArrowDown') movePlayer(1, 0);
    else if (event.key === 'ArrowLeft') movePlayer(0, -1);
    else if (event.key === 'ArrowRight') movePlayer(0, 1);
});

initGame();
