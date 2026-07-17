function updateStatsDisplay(actionText = null) {
    stats.power = Math.max(0, Math.min(MAX_POWER, stats.power));
    stats.health = Math.max(0, Math.min(MAX_HEALTH, stats.health));

    document.getElementById('stat-power').innerText = stats.power;
    document.getElementById('stat-health').innerText = stats.health;
    document.getElementById('tool-status').innerText = toolCount;

    if (stats.health < MAX_HEALTH) startHealthRegenTimer();
    else {
        clearTimeout(healthRegenTimer);
        healthRegenTimer = null;
    }

    if (actionText !== null) {
        document.getElementById('status-action').innerText = actionText;
    }

    if (stats.health <= 0 && !isGameOver) {
        isGameOver = true;
        document.getElementById('game-over').style.display = 'flex';
        stopAllRegenTimers();
        stopTigerTimers();
        clearTigerFromBoard();
        renderGrid();
    }
}

function renderGrid() {
    const grid = document.getElementById('island');
    const fields = grid.querySelectorAll('.field');
    fields.forEach(f => f.remove());

    for (let i = 0; i < TOTAL_FIELDS; i++) {
        const field = document.createElement('div');
        field.className = 'field';

        if (MOUNTAIN_POSITIONS.includes(i)) {
            field.classList.add('mountain');
        }

        if (i === playerIndex) {
            field.classList.add('player-here');
            if (isBusy) field.classList.add('player-busy');
            if (board[i] === TENT_SYMBOL) field.innerHTML = '🏕️🧍';
            else if (ORE_SYMBOLS.includes(board[i])) field.innerHTML = `${MOUNTAIN_SYMBOL}${board[i]}🧍`;
            else field.innerHTML = '🧍';
        } else if (board[i] !== '') {
            field.innerHTML = MOUNTAIN_POSITIONS.includes(i) && ORE_SYMBOLS.includes(board[i])
                ? `${MOUNTAIN_SYMBOL}${board[i]}`
                : board[i];
        }

        grid.appendChild(field);
    }
}
