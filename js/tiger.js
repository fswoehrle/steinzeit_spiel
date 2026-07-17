function clearTigerFromBoard() {
    if (tigerIndex >= 0 && board[tigerIndex] === TIGER_SYMBOL) {
        board[tigerIndex] = '';
    }
    tigerIndex = -1;
}

function stopTigerTimers() {
    clearTimeout(tigerMoveTimer);
    clearTimeout(tigerLifeTimer);
    clearTimeout(tigerSpawnInterval);
    clearTimeout(tigerRespawnTimer);
}

function scheduleTigerRespawn(delayMs) {
    clearTimeout(tigerRespawnTimer);
    tigerRespawnTimer = setTimeout(() => {
        spawnTiger();
    }, delayMs);
}

function clearTigerAndScheduleRespawn(delayMs, statusText) {
    clearTimeout(tigerMoveTimer);
    clearTimeout(tigerLifeTimer);

    if (tigerIndex >= 0 && board[tigerIndex] === TIGER_SYMBOL) {
        board[tigerIndex] = '';
    }

    tigerIndex = -1;
    renderGrid();

    if (statusText) {
        updateStatsDisplay(statusText);
    }

    scheduleTigerRespawn(delayMs);
}

function tigerAttackIfOnPlayer() {
    if (board[playerIndex] === TENT_SYMBOL) {
        updateStatsDisplay('Im Lager bist du vor dem Tiger sicher');
        return false;
    }

    if (tigerIndex === playerIndex && !isGameOver) {
        stats.health -= 8;
        updateStatsDisplay('Tigerangriff! -8 Gesundheit');
        if (isGameOver) return true;
    }
    return false;
}

function startTigerMovement() {
    clearTimeout(tigerMoveTimer);

    const step = () => {
        if (isGameOver) return;
        if (tigerIndex === -1) return;

        let tigerRow = Math.floor(tigerIndex / COLS);
        let tigerCol = tigerIndex % COLS;
        const playerRow = Math.floor(playerIndex / COLS);
        const playerCol = playerIndex % COLS;

        let nextRow = tigerRow;
        let nextCol = tigerCol;

        if (Math.abs(playerRow - tigerRow) >= Math.abs(playerCol - tigerCol)) {
            if (playerRow > tigerRow) nextRow++;
            else if (playerRow < tigerRow) nextRow--;
            else if (playerCol > tigerCol) nextCol++;
            else if (playerCol < tigerCol) nextCol--;
        } else {
            if (playerCol > tigerCol) nextCol++;
            else if (playerCol < tigerCol) nextCol--;
            else if (playerRow > tigerRow) nextRow++;
            else if (playerRow < tigerRow) nextRow--;
        }

        if (nextRow < 0 || nextRow >= ROWS || nextCol < 0 || nextCol >= COLS) {
            tigerMoveTimer = setTimeout(step, TIGER_MOVE_MS);
            return;
        }

        const nextIndex = nextRow * COLS + nextCol;

        if (nextIndex === playerIndex && board[playerIndex] === TENT_SYMBOL) {
            tigerMoveTimer = setTimeout(step, TIGER_MOVE_MS);
            return;
        }

        if (nextIndex !== playerIndex) {
            if (board[nextIndex] !== '') {
                tigerMoveTimer = setTimeout(step, TIGER_MOVE_MS);
                return;
            }
        }

        if (board[tigerIndex] === TIGER_SYMBOL) board[tigerIndex] = '';
        tigerIndex = nextIndex;

        if (tigerIndex !== playerIndex) {
            board[tigerIndex] = TIGER_SYMBOL;
        }

        const attacked = tigerAttackIfOnPlayer();
        renderGrid();

        if (!attacked && tigerIndex !== -1) {
            tigerMoveTimer = setTimeout(step, TIGER_MOVE_MS);
        }
    };

    tigerMoveTimer = setTimeout(step, TIGER_MOVE_MS);
}

function spawnTiger() {
    if (isGameOver) return;
    if (tigerIndex !== -1) return;

    const idx = getRandomFreeFieldIndex(true);
    if (idx === -1) return;

    tigerIndex = idx;
    board[tigerIndex] = TIGER_SYMBOL;
    renderGrid();
    updateStatsDisplay('Ein Tiger ist aufgetaucht!');

    startTigerMovement();

    tigerLifeTimer = setTimeout(() => {
        if (isGameOver) return;
        clearTigerAndScheduleRespawn(TIGER_RESPAWN_AFTER_VANISH_MS, 'Der Tiger ist verschwunden.');
    }, TIGER_LIFETIME_MS);
}

function startTigerSpawner() {
    scheduleTigerRespawn(TIGER_SPAWN_MS);
}

function huntTiger() {
    if (tigerIndex === -1) return false;

    inventory['🐅'] += 1;
    document.getElementById(idMapping['🐅']).innerText = inventory['🐅'];
    clearTigerAndScheduleRespawn(TIGER_RESPAWN_AFTER_HUNT_MS, 'Tiger erlegt! Neuer Tiger kommt in 2 Minuten');
    return true;
}
