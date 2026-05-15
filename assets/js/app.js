// app.js - Main application logic and UI management

const App = {
    game: null,
    puzzlesData: null,
    currentDifficulty: null,

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
        } catch (e) {
            console.error('Failed to load puzzles:', e);
            alert('Failed to load puzzles. Please refresh the page.');
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
        this.showScreen('level-list-screen');
        
        // Update title
        document.getElementById('difficulty-title').textContent = 
            difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
        
        // Generate level buttons
        const levelGrid = document.getElementById('level-grid');
        levelGrid.innerHTML = '';
        
        const levelCount = 250; // 250 levels per difficulty
        for (let i = 1; i <= levelCount; i++) {
            const btn = document.createElement('button');
            btn.className = 'level-btn';
            btn.textContent = i;
            
            if (Storage.isLevelCompleted(difficulty, i)) {
                btn.classList.add('completed');
            }
            
            btn.addEventListener('click', () => {
                this.loadLevel(difficulty, i);
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
        if (nextLevel <= 250) {
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
