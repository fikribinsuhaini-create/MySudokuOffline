// app.js - Main application logic and UI management

const App = {
    game: null,
    puzzlesData: null,
    currentDifficulty: null,
    currentLevelPage: 0,
    levelsPerPage: 100,

    // Initialize app
    async init() {
        this.game = new SudokuGame();
        await this.loadPuzzles();
        this.setupEventListeners();
        this.checkResumeGame();
    },

    // Load puzzles data
    async loadPuzzles() {
        try {
            const response = await fetch('/assets/data/puzzles.json');
            this.puzzlesData = await response.json();
            this.updateDifficultyCounts();
        } catch (e) {
            console.error('Failed to load puzzles:', e);
            alert('Failed to load puzzles. Please refresh the page.');
        }
    },

    getLevelCount(difficulty) {
        const list = this.puzzlesData?.[difficulty];
        return Array.isArray(list) ? list.length : 0;
    },

    updateDifficultyCounts() {
        const diffs = ['easy', 'medium', 'hard', 'expert'];
        for (const d of diffs) {
            const el = document.querySelector(`[data-diff-count="${d}"]`);
            if (!el) continue;
            const count = this.getLevelCount(d);
            if (count > 0) el.textContent = `${count} Levels`;
        }
    },

    // Setup all event listeners
    setupEventListeners() {
        // Difficulty selection
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const difficulty = e.currentTarget.dataset.difficulty;
                this.showLevelList(difficulty);
            });
        });

        // Resume button
        document.getElementById('resume-btn')?.addEventListener('click', () => {
            this.resumeGame();
        });

        // Back buttons
        document.getElementById('back-to-menu')?.addEventListener('click', () => {
            this.showScreen('level-select-screen');
        });

        document.getElementById('back-to-levels')?.addEventListener('click', () => {
            this.saveAndExitGame();
        });

        // Level pagination
        document.getElementById('levels-prev')?.addEventListener('click', () => {
            this.changeLevelPage(-1);
        });

        document.getElementById('levels-next')?.addEventListener('click', () => {
            this.changeLevelPage(1);
        });

        // Stats screen
        document.getElementById('stats-btn')?.addEventListener('click', () => {
            this.showStats();
        });

        document.getElementById('back-from-stats')?.addEventListener('click', () => {
            this.showScreen('level-select-screen');
        });

        // Control buttons
        document.getElementById('notes-btn')?.addEventListener('click', () => {
            this.toggleNotesMode();
        });

        document.getElementById('hint-btn')?.addEventListener('click', () => {
            this.useHint();
        });

        document.getElementById('undo-btn')?.addEventListener('click', () => {
            this.undo();
        });

        document.getElementById('erase-btn')?.addEventListener('click', () => {
            this.erase();
        });

        // Number pad
        document.querySelectorAll('.number-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const number = parseInt(e.currentTarget.dataset.number);
                this.handleNumberInput(number);
            });
        });

        // Win modal buttons
        document.getElementById('next-level-btn')?.addEventListener('click', () => {
            this.loadNextLevel();
        });

        document.getElementById('back-to-menu-btn')?.addEventListener('click', () => {
            this.closeWinModal();
            this.showScreen('level-select-screen');
        });
    },

    // Show screen
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId)?.classList.add('active');
    },

    // Check for resume game
    checkResumeGame() {
        const savedGame = Storage.loadCurrentGame();
        if (savedGame) {
            const resumeContainer = document.getElementById('resume-container');
            const resumeLevel = document.getElementById('resume-level');
            const resumeTime = document.querySelector('.resume-time');
            
            resumeContainer.style.display = 'block';
            resumeLevel.textContent = `${savedGame.levelNumber} (${savedGame.difficulty})`;
            resumeTime.textContent = this.game.formatTime(savedGame.timer);
        }
    },

    // Resume saved game
    resumeGame() {
        const savedGame = Storage.loadCurrentGame();
        if (savedGame) {
            this.game.setState(savedGame);
            this.startGame();
        }
    },

    // Show level list for difficulty
    showLevelList(difficulty) {
        this.currentDifficulty = difficulty;
        this.currentLevelPage = 0;
        this.showScreen('level-list-screen');
        
        // Update title
        document.getElementById('difficulty-title').textContent = 
            difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
        
        this.renderLevelPage();
    },

    showStats() {
        this.renderStats();
        this.showScreen('stats-screen');
    },

    renderStats() {
        const grid = document.getElementById('stats-grid');
        if (!grid) return;

        const completed = Storage.getCompletedLevels();
        const difficulties = ['easy', 'medium', 'hard', 'expert'];

        const byDifficulty = {};
        for (const d of difficulties) byDifficulty[d] = [];

        for (const [key, value] of Object.entries(completed)) {
            const [difficulty, levelStr] = key.split('_');
            const levelNumber = Number.parseInt(levelStr, 10);
            if (!byDifficulty[difficulty] || !Number.isFinite(levelNumber)) continue;
            byDifficulty[difficulty].push({ levelNumber, ...value });
        }

        const formatTime = (seconds) => this.game ? this.game.formatTime(seconds) : `${seconds}s`;

        grid.innerHTML = '';

        // Overall card
        const totalLevels = difficulties.reduce((acc, d) => acc + this.getLevelCount(d), 0);
        const totalCompleted = difficulties.reduce((acc, d) => acc + byDifficulty[d].length, 0);
        const overallCard = document.createElement('div');
        overallCard.className = 'stats-card';
        overallCard.innerHTML = `
            <div class="stats-card-title">
                <h3>Overall</h3>
                <span class="stats-small">${totalCompleted}/${totalLevels}</span>
            </div>
            <div class="stats-rows">
                <div class="stats-row"><span class="label">Completed</span><span class="value">${totalCompleted}</span></div>
                <div class="stats-row"><span class="label">Remaining</span><span class="value">${Math.max(0, totalLevels - totalCompleted)}</span></div>
            </div>
        `;
        grid.appendChild(overallCard);

        // Per-difficulty cards
        for (const d of difficulties) {
            const list = byDifficulty[d];
            const total = this.getLevelCount(d);
            const completedCount = list.length;

            let bestTime = null;
            let bestLevel = null;
            let totalTime = 0;
            let totalMistakes = 0;
            let latestAt = null;

            for (const item of list) {
                totalTime += item.time || 0;
                totalMistakes += item.mistakes || 0;

                if (Number.isFinite(item.time) && (bestTime === null || item.time < bestTime)) {
                    bestTime = item.time;
                    bestLevel = item.levelNumber;
                }
                if (Number.isFinite(item.completedAt) && (latestAt === null || item.completedAt > latestAt)) {
                    latestAt = item.completedAt;
                }
            }

            const avgTime = completedCount > 0 ? Math.round(totalTime / completedCount) : null;
            const avgMistakes = completedCount > 0 ? (totalMistakes / completedCount) : null;
            const latestDate = latestAt ? new Date(latestAt).toLocaleDateString() : null;

            const card = document.createElement('div');
            card.className = 'stats-card';
            card.innerHTML = `
                <div class="stats-card-title">
                    <h3>${d.charAt(0).toUpperCase() + d.slice(1)}</h3>
                    <span class="stats-small">${completedCount}/${total}</span>
                </div>
                <div class="stats-rows">
                    <div class="stats-row"><span class="label">Best Time</span><span class="value">${bestTime === null ? '-' : `${formatTime(bestTime)} (#${bestLevel})`}</span></div>
                    <div class="stats-row"><span class="label">Avg Time</span><span class="value">${avgTime === null ? '-' : formatTime(avgTime)}</span></div>
                    <div class="stats-row"><span class="label">Avg Mistakes</span><span class="value">${avgMistakes === null ? '-' : avgMistakes.toFixed(1)}</span></div>
                    <div class="stats-row"><span class="label">Last Completed</span><span class="value">${latestDate ?? '-'}</span></div>
                </div>
            `;
            grid.appendChild(card);
        }
    },

    changeLevelPage(delta) {
        const total = this.getLevelCount(this.currentDifficulty);
        const totalPages = Math.max(1, Math.ceil(total / this.levelsPerPage));
        const next = Math.min(Math.max(this.currentLevelPage + delta, 0), totalPages - 1);
        if (next === this.currentLevelPage) return;
        this.currentLevelPage = next;
        this.renderLevelPage();
    },

    renderLevelPage() {
        const difficulty = this.currentDifficulty;
        const total = this.getLevelCount(difficulty);
        if (total <= 0) return;

        const startIndex = this.currentLevelPage * this.levelsPerPage; // 0-based
        const endIndex = Math.min(startIndex + this.levelsPerPage, total);

        // Pagination UI
        const pagination = document.getElementById('level-pagination');
        const pageLabel = document.getElementById('levels-page-label');
        const prevBtn = document.getElementById('levels-prev');
        const nextBtn = document.getElementById('levels-next');
        const totalPages = Math.max(1, Math.ceil(total / this.levelsPerPage));
        if (pagination) pagination.style.display = totalPages > 1 ? 'flex' : 'none';
        if (pageLabel) pageLabel.textContent = `${startIndex + 1}-${endIndex} / ${total}`;
        if (prevBtn) prevBtn.disabled = this.currentLevelPage === 0;
        if (nextBtn) nextBtn.disabled = this.currentLevelPage >= totalPages - 1;

        // Generate level buttons
        const levelGrid = document.getElementById('level-grid');
        levelGrid.innerHTML = '';
        for (let levelNumber = startIndex + 1; levelNumber <= endIndex; levelNumber++) {
            const btn = document.createElement('button');
            btn.className = 'level-btn';
            btn.type = 'button';
            btn.textContent = levelNumber;

            if (Storage.isLevelCompleted(difficulty, levelNumber)) {
                btn.classList.add('completed');
            }

            btn.addEventListener('click', () => {
                this.loadLevel(difficulty, levelNumber);
            });

            levelGrid.appendChild(btn);
        }
    },

    // Load specific level
    loadLevel(difficulty, levelNumber) {
        if (this.game.loadPuzzle(difficulty, levelNumber, this.puzzlesData)) {
            this.startGame();
        } else {
            alert('Failed to load level');
        }
    },

    // Start game
    startGame() {
        this.showScreen('game-screen');
        this.renderBoard();
        this.updateUI();
        this.game.startTimer();
        this.updateTimer();
    },

    // Render Sudoku board
    renderBoard() {
        const board = document.getElementById('sudoku-board');
        board.innerHTML = '';
        
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                const value = this.game.getCell(row, col);
                
                if (this.game.isFixed(row, col)) {
                    cell.classList.add('fixed');
                    cell.textContent = value;
                } else if (value !== 0) {
                    cell.textContent = value;
                } else {
                    // Check for notes
                    const notes = this.game.getNotes(row, col);
                    if (notes.length > 0) {
                        cell.classList.add('notes-mode');
                        const notesGrid = document.createElement('div');
                        notesGrid.className = 'notes-grid';
                        for (let n = 1; n <= 9; n++) {
                            const noteDiv = document.createElement('div');
                            noteDiv.className = 'note';
                            if (notes.includes(n)) {
                                noteDiv.textContent = n;
                            }
                            notesGrid.appendChild(noteDiv);
                        }
                        cell.appendChild(notesGrid);
                    }
                }
                
                cell.addEventListener('click', () => {
                    this.selectCell(row, col);
                });
                
                board.appendChild(cell);
            }
        }
    },

    // Select cell
    selectCell(row, col) {
        this.game.selectedCell = { row, col };
        this.updateCellHighlights();
    },

    // Update cell highlights
    updateCellHighlights() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.classList.remove('selected', 'highlighted', 'same-number');
        });
        
        if (!this.game.selectedCell) return;
        
        const { row, col } = this.game.selectedCell;
        const selectedValue = this.game.getCell(row, col);
        
        cells.forEach(cell => {
            const r = parseInt(cell.dataset.row);
            const c = parseInt(cell.dataset.col);
            
            // Highlight selected cell
            if (r === row && c === col) {
                cell.classList.add('selected');
            }
            
            // Highlight related cells
            const relatedCells = this.game.getRelatedCells(row, col);
            if (relatedCells.includes(r * 9 + c)) {
                cell.classList.add('highlighted');
            }
            
            // Highlight same numbers
            if (selectedValue !== 0 && this.game.getCell(r, c) === selectedValue) {
                cell.classList.add('same-number');
            }
        });
    },

    // Handle number input
    handleNumberInput(number) {
        if (!this.game.selectedCell) return;
        
        const { row, col } = this.game.selectedCell;
        
        if (this.game.notesMode) {
            this.game.toggleNote(row, col, number);
            this.renderBoard();
            this.updateCellHighlights();
        } else {
            const isCorrect = this.game.setCell(row, col, number);
            this.renderBoard();
            this.updateCellHighlights();
            this.updateUI();
            
            if (!isCorrect) {
                this.showError(row, col);
            }
            
            this.saveGameState();
            
             if (this.game.isComplete()) {
                 this.handleWin();
             }
         }
        
        this.updateNumberPad();
    },

    // Toggle notes mode
    toggleNotesMode() {
        this.game.notesMode = !this.game.notesMode;
        const notesBtn = document.getElementById('notes-btn');
        notesBtn.classList.toggle('active', this.game.notesMode);
    },

    // Use hint
    useHint() {
        const hint = this.game.getHint();
        if (hint) {
            this.renderBoard();
            this.game.selectedCell = { row: hint.row, col: hint.col };
            this.updateCellHighlights();
            this.updateUI();
            this.saveGameState();
            
            if (this.game.isComplete()) {
                this.handleWin();
            }
        }
    },

    // Undo last move
    undo() {
        if (this.game.undo()) {
            this.renderBoard();
            this.updateCellHighlights();
            this.updateUI();
            this.saveGameState();
        }
    },

    // Erase selected cell
    erase() {
        if (!this.game.selectedCell) return;
        
        const { row, col } = this.game.selectedCell;
        if (this.game.erase(row, col)) {
            this.renderBoard();
            this.updateCellHighlights();
            this.updateUI();
            this.saveGameState();
        }
    },

    // Show error animation
    showError(row, col) {
        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            cell.classList.add('error');
            setTimeout(() => cell.classList.remove('error'), 300);
        }
    },

    // Update UI elements
    updateUI() {
        // Update level number
        document.getElementById('level-number').textContent = 
            `Level ${this.game.levelNumber} - ${this.game.difficulty.toUpperCase()}`;
        
        // Update mistakes
        document.getElementById('mistakes').textContent = 
            `❌ ${this.game.mistakes}`;
    },

    // Update timer display
    updateTimer() {
        const updateDisplay = () => {
            document.getElementById('timer').textContent = 
                this.game.formatTime(this.game.timer);
        };
        
        updateDisplay();
        setInterval(updateDisplay, 1000);
    },

    // Update number pad (show used up numbers)
    updateNumberPad() {
        document.querySelectorAll('.number-btn').forEach(btn => {
            const number = parseInt(btn.dataset.number);
            const count = this.game.countNumber(number);
            btn.classList.toggle('used-up', count >= 9);
        });
    },

    // Save game state
    saveGameState() {
        Storage.saveCurrentGame(this.game.getState());
    },

    // Save and exit game
    saveAndExitGame() {
        this.game.stopTimer();
        this.saveGameState();
        this.showLevelList(this.game.difficulty);
    },

    // Handle win
    handleWin() {
        this.game.stopTimer();
        Storage.markLevelCompleted(
            this.game.difficulty,
            this.game.levelNumber,
            this.game.timer,
            this.game.mistakes
        );
        Storage.clearCurrentGame();
        
        document.getElementById('final-time').textContent = 
            this.game.formatTime(this.game.timer);
        document.getElementById('final-mistakes').textContent = 
            `${this.game.mistakes}`;
        
        document.getElementById('win-modal').classList.add('active');
    },

    // Close win modal
    closeWinModal() {
        document.getElementById('win-modal').classList.remove('active');
    },

    // Load next level
    loadNextLevel() {
        this.closeWinModal();
        const nextLevel = this.game.levelNumber + 1;
        const maxLevel = this.getLevelCount(this.game.difficulty);
        if (nextLevel <= maxLevel) {
            this.loadLevel(this.game.difficulty, nextLevel);
        } else {
            this.showScreen('level-select-screen');
        }
    }
};

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
