#!/usr/bin/env node
// generate-puzzles.js - Generate 1000 Sudoku puzzles with solutions

const fs = require('fs');
const path = require('path');

class SudokuGenerator {
    constructor() {
        this.board = Array(9).fill(0).map(() => Array(9).fill(0));
    }

    // Check if number can be placed at position
    isValid(board, row, col, num) {
        // Check row
        for (let x = 0; x < 9; x++) {
            if (board[row][x] === num) return false;
        }

        // Check column
        for (let x = 0; x < 9; x++) {
            if (board[x][col] === num) return false;
        }

        // Check 3x3 box
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[boxRow + i][boxCol + j] === num) return false;
            }
        }

        return true;
    }

    // Solve sudoku using backtracking
    solve(board) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) {
                    for (let num = 1; num <= 9; num++) {
                        if (this.isValid(board, row, col, num)) {
                            board[row][col] = num;
                            if (this.solve(board)) {
                                return true;
                            }
                            board[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    // Generate a complete solved board
    generateSolution() {
        const board = Array(9).fill(0).map(() => Array(9).fill(0));
        
        // Fill diagonal 3x3 boxes first (they don't depend on each other)
        for (let box = 0; box < 9; box += 3) {
            const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            this.shuffle(nums);
            let idx = 0;
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    board[box + i][box + j] = nums[idx++];
                }
            }
        }
        
        // Solve the rest
        this.solve(board);
        return board;
    }

    // Shuffle array
    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // Count solutions (up to limit)
    countSolutions(board, limit = 2) {
        let count = [0];
        this.countSolutionsHelper(board, count, limit);
        return count[0];
    }

    countSolutionsHelper(board, count, limit) {
        if (count[0] >= limit) return;

        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) {
                    for (let num = 1; num <= 9; num++) {
                        if (this.isValid(board, row, col, num)) {
                            board[row][col] = num;
                            this.countSolutionsHelper(board, count, limit);
                            board[row][col] = 0;
                            if (count[0] >= limit) return;
                        }
                    }
                    return;
                }
            }
        }
        count[0]++;
    }

    // Generate puzzle by removing numbers from solution
    generatePuzzle(solution, difficulty) {
        const puzzle = solution.map(row => [...row]);
        
        // Difficulty levels (number of clues to leave)
        const clues = {
            easy: 40,      // 40-45 clues
            medium: 32,    // 32-37 clues
            hard: 27,      // 27-30 clues
            expert: 23     // 23-26 clues
        };

        const targetClues = clues[difficulty] + Math.floor(Math.random() * 6);
        let cells = [];
        for (let i = 0; i < 81; i++) {
            cells.push(i);
        }
        this.shuffle(cells);

        let removed = 0;
        for (let i = 0; i < cells.length && removed < (81 - targetClues); i++) {
            const pos = cells[i];
            const row = Math.floor(pos / 9);
            const col = pos % 9;
            const backup = puzzle[row][col];
            
            puzzle[row][col] = 0;
            
            // Check if still has unique solution
            const testBoard = puzzle.map(r => [...r]);
            if (this.countSolutions(testBoard) === 1) {
                removed++;
            } else {
                puzzle[row][col] = backup;
            }
        }

        return puzzle;
    }

    // Convert board to string
    boardToString(board) {
        return board.flat().map(n => n === 0 ? '.' : n).join('');
    }

    // Generate one puzzle set
    generatePuzzleSet(difficulty) {
        const solution = this.generateSolution();
        const puzzle = this.generatePuzzle(solution, difficulty);
        
        return {
            puzzle: this.boardToString(puzzle),
            solution: this.boardToString(solution)
        };
    }
}

// Generate all puzzles
function generateAllPuzzles() {
    console.log('Generating 1000 Sudoku puzzles...');
    console.log('This may take a few minutes...\n');

    const generator = new SudokuGenerator();
    const puzzles = {
        easy: [],
        medium: [],
        hard: [],
        expert: []
    };

    const difficulties = ['easy', 'medium', 'hard', 'expert'];
    const puzzlesPerDifficulty = 250;

    for (const difficulty of difficulties) {
        console.log(`Generating ${puzzlesPerDifficulty} ${difficulty} puzzles...`);
        for (let i = 0; i < puzzlesPerDifficulty; i++) {
            puzzles[difficulty].push(generator.generatePuzzleSet(difficulty));
            
            if ((i + 1) % 25 === 0) {
                console.log(`  ${i + 1}/${puzzlesPerDifficulty} completed`);
            }
        }
        console.log(`✓ ${difficulty} complete\n`);
    }

    return puzzles;
}

// Main execution
const puzzles = generateAllPuzzles();

// Save to file
const outputPath = path.join(__dirname, 'puzzles.json');
fs.writeFileSync(outputPath, JSON.stringify(puzzles, null, 2));

console.log('✓ All puzzles generated successfully!');
console.log(`Saved to: ${outputPath}`);
console.log(`Total puzzles: ${Object.values(puzzles).flat().length}`);
