const NEED_TO_WIN = 3; // number of adjacent symbols needed to win
const DISPLAY_SYMBOL = {
    // mapping from internal value to external display symbol
    null: '',
    1: 'X',
    '-1': 'O' // the letter O is more aesthetic than a zero
};

class Game {
    constructor(size, root) {
        this.size = size;
        this.elements = this.createGame(root);

        this.initializeState();
    }

    // Initialization
    initializeState() {
        this.values = this.emptyValues();
        this.nextPlayer = +1; // X
        this.winner = null;

        this.history = [];
        this.appendStep();

        this.syncStatus();
        this.syncCells();
    }

    emptyValues() {
        let state = [];
        for (let i = 0; i < this.size; i++) {
            let row = new Array(this.size).fill(null); // different one each time
            state.push(row);
        }
        return state;
    }

    createHistoryBoard(step) {
        let board = $('<table>', { 'class': 'board' });
        for (let r = 0; r < this.size; r++) {
            let row = $('<tr>');
            for (let c = 0; c < this.size; c++) {
                let cell = $('<td>');
                let value = step.values[r][c];
                cell.text(DISPLAY_SYMBOL[value]);
                row.append(cell);
            }
            board.append(row);
        }

        board.click(() => {
            this.values = step.values;
            this.nextPlayer = step.nextPlayer;
            this.winner = step.winner;

            let truncatedHistory = this.history.slice(0, step.number + 1); // keep history up until this step
            this.history = deepCopyArray(truncatedHistory);

            this.syncStatus();
            this.syncCells();
            this.syncHistory();
        });

        return board;
    }

    createGame(root) {
        // create the cell objects
        let allCells = [];
        for (let r = 0; r < this.size; r++) {
            let row = [];
            for (let c = 0; c < this.size; c++) {
                let cell = $('<td>', {
                    'class': 'ripple',
                    click: () => this.fillCell(r, c)
                });
                row.push(cell);
            }
            allCells.push(row);
        }

        // build and insert the elements into the DOM
        let message = $('<span>', { 'class': 'message' });
        let player = $('<span>', { 'class': 'player' });
        let status = $('<p>', { 'class': 'status' }).append(message).append(': ').append(player);

        let rowElements = allCells.map(rowCells => $('<tr>').append(rowCells));
        let board = $('<table>', { 'class': 'board' }).append(rowElements);

        let activeSide = $('<div>', { 'class': 'active-side' }).append(status).append(board);

        let historyBoards = $('<div>', { 'class': 'boards' });
        let history = $('<div>', { 'class': 'history' }).append('<p>History</p>').append(historyBoards);

        let game = $('<article>', { 'class': 'game' }).append(activeSide).append(history).appendTo(root);

        // height is only evaluated after the element is inserted in the DOM
        let height = activeSide.height();
        history.css({ height: height + 'px' });

        return { allCells, game, message, player, historyBoards };
    }

    // Updating
    fillCell(row, col) {
        // do nothing if the game is over
        if (this.winner !== null) return;

        let currentValue = this.values[row][col];
        // do nothing if the cell is already filled
        if (currentValue !== null) return;

        // update the internal values and reflect the changes
        this.values[row][col] = this.nextPlayer; // set current player
        this.nextPlayer *= -1; // switch players
        this.winner = this.findWinner();

        this.syncCells(); // show symbols and highlights
        this.syncStatus(); // show next player or winner

        this.appendStep();
    }

    syncStatus() {
        let gameOver = this.winner !== null;
        this.elements.message.text(gameOver ? 'Winner' : 'Next player');
        this.elements.player.text(DISPLAY_SYMBOL[gameOver ? this.winner : this.nextPlayer]);

        if (gameOver) this.elements.game.addClass('game-over');else this.elements.game.removeClass('game-over');
    }
    syncCells() {
        // reflect changes in this.values into the DOM elements, accessed through this.cells
        // and the next player

        let highlightWhom = this.winner === null ? this.nextPlayer : // highlight the next player if game in progress
        this.winner; // if game over, highlight the winner

        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                let value = this.values[r][c];
                let cell = this.elements.allCells[r][c];

                let symbol = DISPLAY_SYMBOL[value];
                cell.text(symbol);

                if (value === null) // empty cell and game is not over
                    cell.removeClass('noninteractive');

                if (value === highlightWhom) cell.addClass('highlighted');else cell.removeClass('highlighted');
            }
        }
    }

    appendStep() {
        let nSteps = this.history.length;
        this.history.push({
            number: nSteps,
            nextPlayer: this.nextPlayer,
            values: deepCopyArray(this.values),
            winner: this.winner
        });
        this.syncHistory();
    }
    syncHistory() {
        let game = this;
        let boards = this.history.map(step => game.createHistoryBoard(step));
        this.elements.historyBoards.html(boards);
    }

    // Win condition
    findWinner() {
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                let deltas = [[[-1, 0], [+1, 0]], // left, right
                [[0, -1], [0, +1]], // above, below
                [[-1, -1], [+1, +1]], // up-left, down-right
                [[+1, -1], [-1, +1]]];
            }
        }

        let sums = [...this.values, // on each row
        ...transpose(this.values), // on each column
        diagonal(this.values), // on main diagonal
        diagonal(mirror(this.values))].map(sum);

        let reachedRequired = sums.filter(sum => Math.abs(sum) === NEED_TO_WIN);
        if (reachedRequired.length === 0)
            // no symbol reached the required number of occurrences to win
            return null;else {
            console.assert(reachedRequired.length === 1, 'There should be at most ONE symbol to reach the required number of occurrences', reachedRequired);
            return Math.sign(reachedRequired[0]); // +1 for a sum of 3, -1 for a sum of -3
        }
    }

}

let gamesRoot = $('#games');
const game = new Game(3, gamesRoot);
//# sourceMappingURL=game.js.map