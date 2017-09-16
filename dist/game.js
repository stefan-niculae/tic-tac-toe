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

/** Utils **/
deepCopyArray = arr => $.extend(true, [], arr);
range = n => [...Array(n).keys()]; /* [0, 1, 2, 3, ... ] */
head = array => {
    /* First element or null */
    if (array.length === 0) return null;
    return array[0];
};

class ReflectiveCell {
    /* Reflects changes to internal state in the DOM element */
    constructor(domElement, game) {
        this._state = null; // empty TODO create symbol with EMPTY, X, O
        this.domElement = domElement.click(e => ReflectiveCell.fillCell(e, this, game));
    }
    set state(value) {
        /* Show the corresponding symbol */
        this._state = value;
        let symbol = DISPLAY_SYMBOL[value];

        this.domElement.text(symbol);
        if (value === null) // empty cell
            // it will be turned noninteractive when the animation ends
            this.domElement.removeClass('noninteractive');
    }
    get state() {
        return this._state;
    }

    static fillCell(clickEvent, cell, game) {
        if (game.isGameOver) return;

        if (cell.state !== null) // cell is already filled
            return;
        cell.state = game.nextPlayer; // actually set the value

        rippleOnClick(clickEvent, cell.domElement);

        game.switchPlayers();
        game.maybeEndGame();
        game.addCurrentStateToHistory();
    }
}

class Game {
    constructor(size, rootElement) {
        this.size = size;

        this.initializeState(rootElement);
    }

    /** Initialization **/
    initializeState(rootElement) {
        this.cellMatrix = this.createCells();
        this.elements = this.createDomElements(rootElement); // has to be set after creating cells (need cell matrix)

        this.winner = null; // has to be set after creating the elements (need message element)
        this.nextPlayer = +1; // has to be set after creating elements and setting the winner (message element and content)

        this.stateHistory = [];
        this.addCurrentStateToHistory(); // add the initial state
    }

    createCells() {
        let game = this;

        return range(this.size).map(() =>
        // Create n rows
        range(this.size).map(() =>
        // Each row contains n cell elements
        new ReflectiveCell($('<td>', { 'class': 'ripple' }), game)));
    }

    createDomElements(gamesRoot) {
        // TODO refactor into more readable syntax
        // Build and insert the elements into the DOM
        let message = $('<span>', { 'class': 'message' });
        let player = $('<span>', { 'class': 'player' });
        let status = $('<p>', { 'class': 'status' }).append(message).append(': ').append(player);

        let rows = this.cellMatrix.map(cells => cells.map(reflectiveCell => reflectiveCell.domElement)).map(cellElements => $('<tr>').append(cellElements));
        let board = $('<table>', { 'class': 'board' }).append(rows);

        let activeSide = $('<div>', { 'class': 'active-side' }).append(status).append(board);

        let historyBoards = $('<div>', { 'class': 'boards' });
        let history = $('<div>', { 'class': 'history' }).append('<p>History</p>').append(historyBoards);

        let game = $('<article>', { 'class': 'game' }).append(activeSide).append(history);

        gamesRoot.append(game).append('<hr>');

        // Height is only evaluated after the element is inserted in the DOM
        let height = activeSide.height();
        history.css({ height: height + 'px' });

        return { game, message, player, history, historyBoards };
    }

    /** Reflective changes in internal cellMatrix in their respective DOM elements **/

    /* The game is over if there exists a winner */
    get isGameOver() {
        return this.winner !== null;
    }

    set nextPlayer(value) {
        this._nextPlayer = value;
        let displayedPlayer = this.isGameOver ? this.winner : this.nextPlayer;
        this.elements.player.text(DISPLAY_SYMBOL[displayedPlayer]);
    }
    get nextPlayer() {
        return this._nextPlayer;
    }

    set winner(value) {
        this._winner = value;
        let message = this.isGameOver ? 'Winner' : 'Next player';
        this.elements.message.text(message);

        let action = this.isGameOver ? 'addClass' : 'removeClass';
        this.elements.game[action]('game-over');
    }
    get winner() {
        return this._winner;
    }

    set stateHistory(value) {
        this._history = value;

        let game = this;
        let pastBoards = this.stateHistory.map(game.createHistoryBoard.bind(game));
        this.elements.historyBoards.html(pastBoards);

        // Scroll to bottom
        let container = this.elements.history;
        container.animate({ scrollTop: container[0].scrollHeight }, 200);
    }
    get stateHistory() {
        return this._history;
    }

    /** Updating **/
    switchPlayers() {
        this.nextPlayer *= -1;
    }

    /** Win condition **/
    maybeEndGame() {
        /* If there is a winner, end the game; otherwise, do nothing */
        let winningNeighbors = this.findWinner();
        if (winningNeighbors === null) // no winner found
            return;

        let { winner, coordinates } = winningNeighbors;
        this.winner = winner;
        this.highlightWinner(coordinates);
    }

    findWinner() {
        /* Return the coordinates of winning triplet of cells, if there is one */
        let game = this;
        let allCells = Array.from(this.iterateCells());
        let winningCells = allCells.map(game.findWinningNeighbors.bind(game)).filter(result => result !== null);
        return head(winningCells); // first winning cell or null
    }

    findWinningNeighbors({ row, col, cell }) {
        /* Check if neighboring cells (left & right, above & below, diagonals) are the same */
        if (cell.state === null) // there can't be a winner with an empty center
            return null;

        let game = this;
        let neighborLines = WIN_DELTAS.map(neighborDeltas => {
            let neighborCoords = neighborDeltas.map(([dx, dy]) => [row + dx, col + dy]);
            let neighborValues = neighborCoords.map(game.maybeGetCellState.bind(game));
            // We filter by the values but keep the coordinates
            return { neighborCoords, neighborValues };
        });
        let winningLines = neighborLines.filter(({ neighborCoords, neighborValues }) =>
        // All neighbors have the same value as the center
        neighborValues.every(v => v === cell.state));

        let winningLine = head(winningLines);
        if (winningLine === null) // no winning lines found
            return null;
        return {
            winner: cell.state,
            coordinates: [...winningLine.neighborCoords, [row, col]]
        };
    }

    highlightWinner(coordinates) {
        for (let { cell } of this.iterateCells()) cell.domElement.removeClass('winner');

        for (let [x, y] of coordinates) {
            let cell = this.cellMatrix[x][y];
            cell.domElement.addClass('winner');
        }
    }

    /** History **/
    addCurrentStateToHistory() {
        /* The current state contains the value of each cell, the next player and the winner */
        let nSteps = this.stateHistory.length;
        // Extract the state from each (reflective) cell in the matrix
        let cellStateMatrix = this.cellMatrix.map(cellsRow => cellsRow.map(cell => cell.state));

        // Create a new one instead of pushing into the old one in order to trigger the setter
        this.stateHistory = [...this.stateHistory, {
            number: nSteps,
            nextPlayer: this.nextPlayer,
            cellStateMatrix: cellStateMatrix,
            winner: this.winner
        }];
    }

    createHistoryBoard(fromState) {
        let cellStateRows = fromState.cellStateMatrix;

        let rowElements = $.map(cellStateRows, cellStateRow => {
            let cellElements = $.map(cellStateRow, cellState => {
                let symbol = DISPLAY_SYMBOL[cellState];
                return $('<td>').text(symbol); // cell element
            });
            return $('<tr>').append(cellElements); // row element
        });

        return $('<table>', { 'class': 'board' }) // board element
        .append(rowElements).click(() => this.resetToState(fromState));
    }

    resetToState(pastState) {
        for (let { row, col, cell } of this.iterateCells()) cell.state = pastState.cellStateMatrix[row][col];
        this.nextPlayer = pastState.nextPlayer;
        this.winner = pastState.winner;

        let truncatedHistory = this.stateHistory.slice(0, pastState.number + 1); // keep stateHistory up until this step
        this.stateHistory = deepCopyArray(truncatedHistory);
    }

    /** Utils **/
    *iterateCells() {
        for (let row = 0; row < this.size; row++) for (let col = 0; col < this.size; col++) yield {
            row,
            col,
            cell: this.cellMatrix[row][col]
        };
    }

    maybeGetCellState([row, col]) {
        /* Returns the value at row x and column y or null if out of bounds */
        let n = this.size;
        if (row < 0 || row >= n || col < 0 || col >= this.size) return null;
        return this.cellMatrix[row][col].state;
    }
}

let gamesRoot = $('#games');
let createGame = n => new Game(n, gamesRoot);
//# sourceMappingURL=game.js.map