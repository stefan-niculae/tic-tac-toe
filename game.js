const CELL_STATES = {}
CELL_STATES.EMPTY = Symbol('Empty Cell')
CELL_STATES.X     = Symbol('X')
CELL_STATES.O     = Symbol('O')
const DISPLAY = {}
DISPLAY[CELL_STATES.EMPTY] = '' // object creation syntax does not work with symbols
DISPLAY[CELL_STATES.X]     = 'X'
DISPLAY[CELL_STATES.O]     = 'O'
const WIN_DELTAS = [
    [[0, -1], [0, +1]], // left, right
    [[-1, 0], [+1, 0]], // above, below
    [[-1, -1], [+1, +1]], // up-left, down-right
    [[+1, -1], [-1, +1]], // down-left, up-right
]

/** Utils **/
deepCopyArray = (arr) => $.extend(true, [], arr)
range = (n) => [...(new Array(n).keys())]  /* [0, 1, 2, 3, ... ] */
head = (array) => {
    /* First element or null */
    if (array.length === 0)
        return null
    return array[0]
}


class ReflectiveCell {
    /* Reflects changes to internal state in the DOM element */
    constructor(domElement, game) {
        this._state = CELL_STATES.EMPTY
        this.domElement = domElement
            .click(e => ReflectiveCell.fillCell(e, this, game))
    }
    set state(value) {
        /* Show the corresponding symbol */
        this._state = value
        let symbol = DISPLAY[value]

        this.domElement.text(symbol)
        if (value === CELL_STATES.EMPTY)  // empty cell
            // it will be turned noninteractive when the animation ends
            this.domElement.removeClass('noninteractive')
    }
    get state() { return this._state }

    static fillCell(clickEvent, cell, game) {
        /* Register the click, updating the game state */
        if (game.isGameOver)
            return

        if (cell.state !== CELL_STATES.EMPTY) // cell is already filled
            return
        cell.state = game.nextPlayer // actually set the value

        rippleOnClick(clickEvent, cell.domElement)

        game.switchPlayers()
        game.maybeEndGame()
        game.addCurrentStateToHistory()
    }
}

class Game {
    constructor(size, rootElement) {
        this.size = size
        this.initializeState(rootElement)
    }

    /** Initialization **/
    initializeState(rootElement) {
        /* Initialize internal values and create DOM elements */
        this.cellMatrix = this.createCells()
        this.elements = this.createDomElements(rootElement)

        this.winner = null // null, X or O
        this.nextPlayer = CELL_STATES.X

        this.stateHistory = []
        this.addCurrentStateToHistory() // add the initial state
    }

    createCells() {
        /* Create the n by n matrix of (reflective) cells */
        let game = this

        return range(this.size).map(() =>
            // Create n rows
            range(this.size).map(() =>
                // Each row contains n cell elements
                new ReflectiveCell($('<td>', {'class': 'ripple'}), game)
            )
        )
    }

    createDomElements(gamesRoot) {
        /* Create and insert the elements into the DOM */
        // TODO refactor into more readable syntax
        let message = $('<span>', {'class': 'message'})
        let player = $('<span>', {'class': 'player'})
        let status = $('<p>', {'class': 'status'})
            .append(message)
            .append(': ')
            .append(player)

        let rows = this.cellMatrix
            .map(cells => cells.map(reflectiveCell => reflectiveCell.domElement))
            .map(cellElements => $('<tr>').append(cellElements))
        let board = $('<table>', {'class': 'board'}).append(rows)

        let activeSide = $('<div>', {'class': 'active-side'})
            .append(status)
            .append(board)

        let historyBoards = $('<div>', {'class': 'boards'})
        let history = $('<div>', {'class': 'history'})
            .append('<p>History</p>')
            .append(historyBoards)

        let game = $('<article>', {'class': 'game'})
            .append(activeSide)
            .append(history)

        gamesRoot
            .append(game)
            .append('<hr>')

        // Height is only evaluated after the element is inserted in the DOM
        let height = activeSide.height()
        history.css({height: height + 'px'})

        return {game, message, player, history, historyBoards}
    }

    /** Reflective changes in internal cellMatrix in their respective DOM elements **/

    /* The game is over if there exists a winner */
    get isGameOver() { return (this.winner !== null) }

    set nextPlayer(value) {
        /* Update the displayed player symbol */
        this._nextPlayer = value
        let displayedPlayer = this.isGameOver ? this.winner : this.nextPlayer
        this.elements.player.text(DISPLAY[displayedPlayer])
    }
    get nextPlayer() { return this._nextPlayer }

    set winner(value) {
        /* Set the message for winning or next player */
        this._winner = value
        let message = this.isGameOver ? 'Winner' : 'Next player'
        this.elements.message.text(message)

        let action = this.isGameOver ? 'addClass' : 'removeClass'
        this.elements.game[action]('game-over')
    }
    get winner() { return this._winner }


    set stateHistory(value) {
        /* Create a board element for each step in the history */
        this._history = value

        let game = this
        let pastBoards = this.stateHistory.map(game.createHistoryBoard.bind(game))
        this.elements.historyBoards.html(pastBoards)

        // Scroll to bottom
        let container = this.elements.history
        container.animate({scrollTop: container[0].scrollHeight}, 200)
    }
    get stateHistory() { return this._history }


    /** Updating **/
    switchPlayers() {
        /* X becomes O and vice-versa */
        this.nextPlayer = (this.nextPlayer === CELL_STATES.X) ?
            CELL_STATES.O :
            CELL_STATES.X
    }


    /** Win condition **/
    maybeEndGame() {
        /* If there is a winner, end the game; otherwise, do nothing */
        let winningNeighbors = this.findWinner()
        if (winningNeighbors === null) // no winner found
            return

        let {winner, coordinates} = winningNeighbors
        this.winner = winner
        this.highlightWinner(coordinates)
    }

    findWinner() {
        /* Return the coordinates of winning triplet of cells, if there is one */
        let game = this
        let allCells = Array.from(this.iterateCells())
        let winningCells = allCells
            .map(game.findWinningNeighbors.bind(game))
            .filter(winningNeighbors => winningNeighbors !== null)
        return head(winningCells) // first winning cell or null
    }

    findWinningNeighbors({row, col, cell}) {
        /* Check if neighboring cells (left & right, above & below, diagonals) are the same */
        if (cell.state === CELL_STATES.EMPTY) // there can't be a winner with an empty center
            return null

        let game = this
        let neighborLines = WIN_DELTAS.map(neighborDeltas => {
            let neighborCoords = neighborDeltas.map(([dx, dy]) => [row + dx, col + dy])
            let neighborValues = neighborCoords.map(game.maybeGetCellState.bind(game))
            // We filter by the values but keep the coordinates
            return {neighborCoords, neighborValues}
        })
        let winningLines = neighborLines.filter(({neighborCoords, neighborValues}) =>
            // All neighbors have the same value as the center
            neighborValues.every(v => v === cell.state)
        )

        let winningLine = head(winningLines)
        if (winningLine === null) // no winning lines found
            return null
        return {
            winner: cell.state,
            coordinates: [...winningLine.neighborCoords, [row, col]]
        }
    }

    highlightWinner(coordinates) {
        /* Highlight the cells that caused the win */
        for (let {cell} of this.iterateCells())
            cell.domElement.removeClass('winner')

        for (let [x, y] of coordinates) {
            let cell = this.cellMatrix[x][y]
            cell.domElement.addClass('winner')
        }
    }


    /** History **/
    addCurrentStateToHistory() {
        /* The current state contains the value of each cell, the next player and the winner */
        let nSteps = this.stateHistory.length
        // Extract the state from each (reflective) cell in the matrix
        let cellStateMatrix = this.cellMatrix.map(cellsRow =>
            cellsRow.map(cell => cell.state)
        )

        // Create a new one instead of pushing into the old one in order to trigger the setter
        this.stateHistory = [...this.stateHistory, {
            number: nSteps,
            nextPlayer: this.nextPlayer,
            cellStateMatrix: cellStateMatrix,
            winner: this.winner,
        }]
    }

    createHistoryBoard(fromState) {
        /* Populate the board and add the hook to be able to restore to this state when clicked */
        let cellStateRows = fromState.cellStateMatrix

        let rowElements = $.map(cellStateRows, cellStateRow => {
            let cellElements = $.map(cellStateRow, cellState => {
                let symbol = DISPLAY[cellState]
                return $('<td>').text(symbol) // cell element
            })
            return $('<tr>').append(cellElements) // row element
        })

        return $('<table>', {'class': 'board'}) // board element
            .append(rowElements)
            .click(() => this.resetToState(fromState))
    }

    resetToState(pastState) {
        /* Replace the state of each cell, next player and the winner and keep only previous history steps */
        for (let {row, col, cell} of this.iterateCells())
            cell.state = pastState.cellStateMatrix[row][col]
        this.nextPlayer = pastState.nextPlayer
        this.winner = pastState.winner

        let truncatedHistory = this.stateHistory.slice(0, pastState.number + 1) // keep history up until this step
        this.stateHistory = deepCopyArray(truncatedHistory)
    }


    /** Utils **/
    *iterateCells() {
        /* Go through each cell in the matrix */
        for (let row = 0; row < this.size; row++)
            for (let col = 0; col < this.size; col++)
                yield {
                    row,
                    col,
                    cell: this.cellMatrix[row][col],
                }
    }

    maybeGetCellState([row, col]) {
        /* Returns the value at row x and column y or null if out of bounds */
        let n = this.size
        if (row < 0 || row >= n || col < 0 || col >= this.size)
            return null
        return this.cellMatrix[row][col].state
    }
}

let gamesRoot = $('#games')
let createGame = (n) => new Game(n, gamesRoot)
