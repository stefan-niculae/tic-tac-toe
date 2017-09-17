import $ from 'jquery'
import { CELL_STATES, CELL_DISPLAY, BoardCell } from './BoardCell'
import { deepCopyArray, range, head, parseHtml } from './utils'
import './style.sass'


const WINNING_LINES_DELTAS = [
    /* A winning line can be vertical, horizontal or diagonal. Each element in this list corresponds to one line.
       Each line is composed of the center and the two neighbors.
       The numbers represent the row and column deltas from the center.
     */
    [[0,  -1], [0,  +1]], // horizontal line: left, right
    [[-1,  0], [+1,  0]], // vertical line: above, below
    [[-1, -1], [+1, +1]], // diagonal line: up-left, down-right
    [[+1, -1], [-1, +1]], // diagonal line: down-left, up-right
]

class Game {
    /* Holds the game board (matrix of cells) and game status (next player and winner).
       Creates the DOM elements and defines how turns are advanced (fill board cell, switch players);
       how the game ends (finding a winning line and restricting interactivity)
       and how the game state is stored as history and reset.
     */

    constructor(size, rootElement) {
        /* Initialize internal values and create DOM elements */
        this.size = size

        this.cellMatrix = this.createCells()
        this.domElements = this.createDomElements(rootElement)

        this.winner = null // can be null, X or O
        this.nextPlayer = CELL_STATES.X
        this.stateHistory = []

        this.addCurrentStateToHistory() // add the initial state
    }

    /** Initialization **/
    createCells() {
        /* Create the n by n matrix of (reflective) cells */
        return range(this.size).map(_ => // create n rows
            range(this.size).map(_ => new BoardCell(this)) // each containing n cell elements
        )
    }

    createDomElements(gamesRoot) {
        /* Create and insert the into the DOM elements for each part of the game */
        // TODO refactor into more readable syntax
        const message = $('<span>', {'class': 'message'})
        const player = $('<span>', {'class': 'player'})
        const status = $('<p>', {'class': 'status'})
            .append(message)
            .append(': ')
            .append(player)

        const rows = this.cellMatrix
            .map(cells => cells.map(reflectiveCell => reflectiveCell.domElement))
            .map(cellElements => $('<tr>').append(cellElements))
        const board = $('<table>', {'class': 'board'}).append(rows)

        const activeSide = $('<div>', {'class': 'active-side'})
            .append(status)
            .append(board)

        const historyBoards = $('<div>', {'class': 'boards'})
        const history = $('<div>', {'class': 'history'})
            .append('<p>History</p>')
            .append(historyBoards)

        const game = $('<article>', {'class': 'game'})
            .append(activeSide)
            .append(history)

        gamesRoot
            .append(game)
            .append('<hr>')

        // Height is only evaluated after the element is inserted in the DOM
        const height = activeSide.height()
        history.css({height: height + 'px'})

        return {game, message, player, history, historyBoards}
    }


    /** Reflective properties **/
    set nextPlayer(player) {
        /* Update the displayed player symbol.
           This field changes after a cell is filled (or when resetting history to an earlier state)
        */
        this._nextPlayer = player // X or O
        const displayedPlayer = this.isGameOver ? this.winner : this.nextPlayer
        this.domElements.player.text(CELL_DISPLAY[displayedPlayer])
    }
    get nextPlayer() { return this._nextPlayer }

    set winner(value) {
        /* Update the displayed message: game in progress or game over.
           This field changes when a winning line was detected after a cell is filled
           (or when resetting history to an earlier state)
        */
        this._winner = value // null, X or O
        const message = this.isGameOver ? 'Winner' : 'Next player'
        this.domElements.message.text(message)

        const action = this.isGameOver ? 'addClass' : 'removeClass'
        this.domElements.game[action]('game-over')
    }
    get winner() { return this._winner }

    set stateHistory(statesList) {
        /* Update the list of previous game states by creating a board for each step in the history.
           This field changes after a cell is filled  (or when resetting history to an earlier state)
         */
        this._history = statesList

        const pastBoards = this.stateHistory.map(state => this.createHistoryBoard(state))
        this.domElements.historyBoards.html(pastBoards)

        // Scroll to bottom
        const container = this.domElements.history
        container.animate({scrollTop: container[0].scrollHeight}, 200)
    }
    get stateHistory() { return this._history }


    /** Computed properties **/
    get flatCells() {
        /* Each cell in one flat array */
        const cellsByRow = range(this.size).map(i =>
            range(this.size).map(j => ({
                row: i,
                col: j,
                cell: this.cellMatrix[i][j]
            }))
        )
        return [].concat(...cellsByRow) // join all rows together
    }

    maybeGetCellState(row, col) {
        /* The value at the given row and column or null if out of bounds */
        const n = this.size
        if (row < 0 || row >= n || col < 0 || col >= this.size)
            return null
        return this.cellMatrix[row][col].state
    }

    get isGameOver() {
        /* The game is over if there exists a winner */
        return (this.winner !== null)
    }


    /** Updating **/
    advanceTurn() {
        /* Switch players (X becomes O and vice-versa) and check if game is over */
        this.nextPlayer = (this.nextPlayer === CELL_STATES.X) ?
            CELL_STATES.O :
            CELL_STATES.X

        const winningNeighbors = this.findWinner()
        if (winningNeighbors !== null) // winning line found
            this.endGame(winningNeighbors)
    }


    /** Win condition **/
    findWinner() {
        /* Return the coordinates of winning triplet of cells (and the symbol that won), if there is one */
        console.log(this.flatCells // there can be multiple winning triplets at the same time
            .filter(cell => cell.state !== CELL_STATES.EMPTY) );
        const winningLinesInfo = this.flatCells // there can be multiple winning triplets at the same time
            .map(cell => this.findWinningLine(cell))
            .filter(winningLine => winningLine !== null)
        return head(winningLinesInfo) // first or null
    }

    findWinningLine({row, col, cell: center}) {
        /* Return the coordinates of the winning line (left & right / above & below / diagonals) if there is one */
        if (center.state === CELL_STATES.EMPTY)  // there can't be a winner with an empty center
            return null

        const neighborLines = WINNING_LINES_DELTAS.map(lineDeltas => {
            const neighborCoordinates = lineDeltas.map(([dx, dy]) => [row + dx, col + dy])
            const neighborValues = neighborCoordinates.map(([x, y]) => this.maybeGetCellState(x, y))
            // We filter by the values but keep the coordinates
            return {neighborCoordinates, neighborValues}
        })
        // There can be multiple winning lines at a time (eg: vertically and horizontally)
        const winningLines = neighborLines.filter(({neighborCoordinates, neighborValues}) =>
            // All neighbors have the same value as the center
            neighborValues.every(v => v === center.state),
        )

        if (winningLines.length === 0) // no winning lines found
            return null
        return {
            player: center.state,
            coordinates: [[row, col], ...winningLines[0].neighborCoordinates],
        }
    }

    endGame({player, coordinates}) {
        /* Mark the game as over by setting the winner. This method is called when a winning line is found. */
        this.winner = player
        this.highlightWinner(coordinates)
    }

    highlightWinner(coordinates) {
        /* Highlight the cells that caused the win */
        for (const {cell} of this.flatCells)
            cell.domElement.removeClass('winner')

        for (const [x, y] of coordinates) {
            const cell = this.cellMatrix[x][y]
            cell.domElement.addClass('winner')
        }
    }


    /** History **/
    addCurrentStateToHistory() {
        /* The current state contains the value of each cell, the next player and the winner status.
           This method is called after a cell is filled.
         */
        // Extract the state from each (reflective) cell in the matrix
        const cellStateMatrix = this.cellMatrix.map(cellsRow =>
            cellsRow.map(cell => cell.state),
        )

        // Create a new one instead of pushing into the old one in order to trigger the setter
        this.stateHistory = [...this.stateHistory, {
            cellStateMatrix: cellStateMatrix,
            nextPlayer:      this.nextPlayer,
            winner:          this.winner,
            // The history array is not being saved, instead we mark how much of it should be kept
            stepNumber:      this.stateHistory.length,
        }]
    }

    createHistoryBoard(fromState) {
        /* Populate the board and add the hook to be able to restore to this state when clicked */
        const cellStateRows = fromState.cellStateMatrix

        const rowElements = $.map(cellStateRows, cellStateRow => {
            const cellElements = $.map(cellStateRow, cellState => {
                const symbol = CELL_DISPLAY[cellState]
                return $('<td>').text(symbol) // cell element
            })
            return $('<tr>').append(cellElements) // row element
        })

        return $('<table>', {'class': 'board'}) // board element
            .append(rowElements)
            .click(() => this.resetToState(fromState))
    }

    resetToState(pastState) {
        /* Replace the state of each cell, the next player and the winner and keep only previous history steps */
        for (const {row, col, cell} of this.flatCells)
            cell.state = pastState.cellStateMatrix[row][col]
        this.nextPlayer = pastState.nextPlayer
        this.winner = pastState.winner

        const truncatedHistory = this.stateHistory.slice(0, pastState.stepNumber + 1) // discard future steps
        this.stateHistory = deepCopyArray(truncatedHistory)
    }

}

export default Game
