// sudoku.js - Sudoku game logic and validation

class SudokuGame {
    constructor() {
        this.puzzle = null;
        this.solution = null;
        this.currentBoard = null;
        this.difficulty = null;
        this.levelNumber = null;
        this.mistakes = 0;
        this.maxMistakes = 3;
        this.timer = 0;
        this.timerInterval = null;
        this.notesMode = false;
        this.selectedCell = null;
        this.history = [];
        this.notes = {}; // cell index -> Set of note numbers
    }

    // Load puzzle from data
    loadPuzzle(difficulty, levelNumber, puzzlesData) {
        const difficultyPuzzles = puzzlesData[difficulty];
        if (!difficultyPuzzles || !difficultyPuzzles[levelNumber - 1]) {
            return false;
        }

        const puzzleData = difficultyPuzzles[levelNumber - 1];
        this.puzzle = this.stringToBoard(puzzleData.puzzle);
        this.solution = this.stringToBoard(puzzleData.solution);
        this.currentBoard = this.puzzle.map(row => [...row]);
        this.difficulty = difficulty;
        this.levelNumber = levelNumber;
        this.mistakes = 0;
        this.timer = 0;
        this.history = [];
        this.notes = {};
        this.selectedCell = null;
        
        return true;
    }

    // Convert puzzle string to 2D array
    stringToBoard(str) {
        const board = [];
        for (let i = 0; i < 9; i++) {
            board.push([]);
            for (let j = 0; j < 9; j++) {
                const char = str[i * 9 + j];
                board[i][j] = char === '.' ? 0 : parseInt(char);
            }
        }
        return board;
    }

    // Get cell value
    getCell(row, col) {
        return this.currentBoard[row][col];
    }

    // Check if cell is fixed (part of original puzzle)
    isFixed(row, col) {
        return this.puzzle[row][col] !== 0;
    }

    // Set cell value
    setCell(row, col, value) {
        if (this.isFixed(row, col)) return 'fixed';

        // Save history for undo
        this.history.push({
            row,
            col,
            oldValue: this.currentBoard[row][col],
            oldNotes: this.notes[row * 9 + col] ? new Set(this.notes[row * 9 + col]) : null
        });

        // Clear notes when setting a number
        if (value !== 0) {
            delete this.notes[row * 9 + col];
        }

        this.currentBoard[row][col] = value;
        
        // Check if it's wrong
        if (value !== 0 && this.solution[row][col] !== value) {
            this.mistakes++;
            return 'wrong';
        }

        return 'ok';
    }

    // Toggle note
    toggleNote(row, col, number) {
        if (this.isFixed(row, col) || this.currentBoard[row][col] !== 0) {
            return;
        }

        const cellIndex = row * 9 + col;
        if (!this.notes[cellIndex]) {
            this.notes[cellIndex] = new Set();
        }

        if (this.notes[cellIndex].has(number)) {
            this.notes[cellIndex].delete(number);
        } else {
            this.notes[cellIndex].add(number);
        }
    }

    // Get notes for cell
    getNotes(row, col) {
        const cellIndex = row * 9 + col;
        return this.notes[cellIndex] ? Array.from(this.notes[cellIndex]) : [];
    }

    // Undo last move
    undo() {
        if (this.history.length === 0) return false;

        const lastMove = this.history.pop();
        this.currentBoard[lastMove.row][lastMove.col] = lastMove.oldValue;
        
        const cellIndex = lastMove.row * 9 + lastMove.col;
        if (lastMove.oldNotes) {
            this.notes[cellIndex] = lastMove.oldNotes;
        } else {
            delete this.notes[cellIndex];
        }

        return true;
    }

    // Erase cell
    erase(row, col) {
        if (this.isFixed(row, col)) return false;

        this.history.push({
            row,
            col,
            oldValue: this.currentBoard[row][col],
            oldNotes: this.notes[row * 9 + col] ? new Set(this.notes[row * 9 + col]) : null
        });

        this.currentBoard[row][col] = 0;
        delete this.notes[row * 9 + col];
        return true;
    }

    // Get hint (reveal a random empty cell)
    getHint() {
        const emptyCells = [];
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (!this.isFixed(row, col) && this.currentBoard[row][col] === 0) {
                    emptyCells.push({ row, col });
                }
            }
        }

        if (emptyCells.length === 0) return null;

        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const hintValue = this.solution[randomCell.row][randomCell.col];
        
        this.history.push({
            row: randomCell.row,
            col: randomCell.col,
            oldValue: 0,
            oldNotes: this.notes[randomCell.row * 9 + randomCell.col] ? 
                     new Set(this.notes[randomCell.row * 9 + randomCell.col]) : null
        });

        this.currentBoard[randomCell.row][randomCell.col] = hintValue;
        delete this.notes[randomCell.row * 9 + randomCell.col];
        
        return { row: randomCell.row, col: randomCell.col, value: hintValue };
    }

    // Check if puzzle is complete and correct
    isComplete() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.currentBoard[row][col] !== this.solution[row][col]) {
                    return false;
                }
            }
        }
        return true;
    }

    // Count how many times a number has been used
    countNumber(num) {
        let count = 0;
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.currentBoard[row][col] === num) {
                    count++;
                }
            }
        }
        return count;
    }

    // Get cells in same row, column, and 3x3 box
    getRelatedCells(row, col) {
        const related = new Set();
        
        // Same row
        for (let c = 0; c < 9; c++) {
            if (c !== col) related.add(row * 9 + c);
        }
        
        // Same column
        for (let r = 0; r < 9; r++) {
            if (r !== row) related.add(r * 9 + col);
        }
        
        // Same 3x3 box
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let r = boxRow; r < boxRow + 3; r++) {
            for (let c = boxCol; c < boxCol + 3; c++) {
                if (r !== row || c !== col) {
                    related.add(r * 9 + c);
                }
            }
        }
        
        return Array.from(related);
    }

    // Start timer
    startTimer() {
        this.stopTimer();
        this.timerInterval = setInterval(() => {
            this.timer++;
        }, 1000);
    }

    // Stop timer
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    // Format time as MM:SS
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Get game state for saving
    getState() {
        return {
            puzzle: this.puzzle,
            solution: this.solution,
            currentBoard: this.currentBoard,
            difficulty: this.difficulty,
            levelNumber: this.levelNumber,
            mistakes: this.mistakes,
            timer: this.timer,
            history: this.history,
            notes: Object.fromEntries(
                Object.entries(this.notes).map(([k, v]) => [k, Array.from(v)])
            )
        };
    }

    // Restore game state
    setState(state) {
        this.puzzle = state.puzzle;
        this.solution = state.solution;
        this.currentBoard = state.currentBoard;
        this.difficulty = state.difficulty;
        this.levelNumber = state.levelNumber;
        this.mistakes = state.mistakes;
        this.timer = state.timer;
        this.history = state.history;
        this.notes = Object.fromEntries(
            Object.entries(state.notes || {}).map(([k, v]) => [k, new Set(v)])
        );
    }
}
