const DISPLAY_SYMBOL = {
    // mapping from internal value to external display symbol
    null: '',
    1: 'X',
    '-1': 'O' // the letter O is more aesthetic than a zero
};
const WIN_DELTAS = [[[0, -1], [0, +1]], // left, right
[[-1, 0], [+1, 0]], // above, below
[[-1, -1], [+1, +1]], // up-left, down-right
[[+1, -1], [-1, +1]]];

// Utils
deepCopyArray = arr => $.extend(true, [], arr);

function* matrixIterator(matrix) {
    for (let row = 0; row < matrix.length; row++) for (let col = 0; col < matrix[row].length; col++) yield {
        row,
        col,
        value: matrix[row][col]
    };
}

function applyOnEachCell(matrix, f) {
    for (let row = 0; row < matrix.length; row++) for (let col = 0; col < matrix[row].length; col++) f(row, col, matrix[row][col]);
}

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
        let gameObj = this;

        // create the cell objects
        let allCells = [];
        for (let r = 0; r < this.size; r++) {
            let row = [];
            for (let c = 0; c < this.size; c++) {
                let cell = $('<td>', { 'class': 'ripple' });
                cell.click(event => {
                    gameObj.fillCell(r, c);
                    rippleOnClick(event, cell);
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

        let game = $('<article>', { 'class': 'game' }).append(activeSide).append(history);

        root.append(game).append('<hr>');

        // height is only evaluated after the element is inserted in the DOM
        let height = activeSide.height();
        history.css({ height: height + 'px' });

        return { allCells, game, message, player, history, historyBoards };
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

        let { winner, coords } = this.findWinner();
        this.winner = winner;
        if (winner !== null) this.highlightWinner(coords);

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

        for (let { row, col, value } of matrixIterator(this.values)) {
            let cell = this.elements.allCells[row][col];

            let symbol = DISPLAY_SYMBOL[value];
            cell.text(symbol);

            if (value === null) // empty cell and game is not over
                cell.removeClass('noninteractive');
        }
    }

    highlightWinner(coords) {
        let cells = this.elements.allCells;
        for (let { value: cell } of matrixIterator(cells)) cell.removeClass('winner');

        for (let [x, y] of coords) cells[x][y].addClass('winner');
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
        let nBoards = Math.max(1, this.history.length - 1);
        let pastSteps = this.history.slice(0, nBoards);

        let game = this;
        let pastBoards = pastSteps.map(step => game.createHistoryBoard(step));
        this.elements.historyBoards.html(pastBoards);

        let container = this.elements.history;
        container.animate({ scrollTop: container[0].scrollHeight }, 200); // scroll to bottom
    }

    // Win condition
    findWinner() {
        let maybeValue = ([x, y]) =>
        // returns the element at row x and column y or undefined if out of bounds
        0 <= x && x < this.size && 0 <= y && y < this.size ? this.values[x][y] : undefined;

        for (let { row, col, value } of matrixIterator(this.values)) {
            if (value === null) // there can't be a winner with an empty center
                continue;

            for (let neighborDeltas of WIN_DELTAS) {
                let neighborCoords = neighborDeltas.map(([dx, dy]) => [row + dx, col + dy]);
                let neighborValues = neighborCoords.map(maybeValue);
                if (neighborValues.every(v => v === value)) return {
                    winner: value,
                    coords: [neighborCoords[0], [row, col], neighborCoords[1]]
                };
            }
        }

        return { winner: null, coords: [] };
    }

}

let gamesRoot = $('#games');
let createGame = n => new Game(n, gamesRoot);
//# sourceMappingURL=game.js.map