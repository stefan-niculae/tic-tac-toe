import { CELL_STATES, CELL_DISPLAY, BoardCell } from './BoardCell'
import { deepCopyArray, range, head, parseHtml, removeChildren } from './utils'
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
        const template = `
          <article class="game">
            
            <div class="active-side">
              <p class="status">
                <span class="message"></span>: 
                <span class="player"></span>
              </p>
              
              <table class="board">
              </table>
            </div>

            <div class="history">
              <p>History</p>
              <div class="boards">
              </div>
            </div>       
              
          </article>
        `
        const gameElement = parseHtml(template).getElementsByClassName('game')[0]

        // Insert the rows of cells to the board element
        const rowElements = this.cellMatrix
            .map(cells => cells.map(reflectiveCell => reflectiveCell.domElement))
            .map(cellElements => {
                const row = document.createElement('tr')
                row.append(...cellElements)
                return row
            })

        const boardElement = gameElement.getElementsByClassName('board')[0]
        boardElement.append(...rowElements)

        // Insert the newly created game into the container of games
        gamesRoot.appendChild(gameElement)

        // Height is only evaluated after the element is inserted in the DOM
        const height = gameElement.getElementsByClassName('active-side')[0].scrollHeight
        gameElement.getElementsByClassName('history')[0].style.height = height + 'px'

        return {
            game:          gameElement,
            message:       gameElement.getElementsByClassName('message')[0],
            player:        gameElement.getElementsByClassName('player')[0],
            history:       gameElement.getElementsByClassName('history')[0],
            historyBoards: gameElement.getElementsByClassName('boards')[0],
        }
    }


    /** Reflective properties **/
    set nextPlayer(player) {
        /* Update the displayed player symbol.
           This field changes after a cell is filled (or when resetting history to an earlier state)
        */
        this._nextPlayer = player // X or O
        this.domElements.player.textContent = CELL_DISPLAY[this.nextPlayer]
    }
    get nextPlayer() { return this._nextPlayer }

    set winner(value) {
        /* Update the displayed message and symbol: game in progress or game over.
           This field changes when a winning line was detected after a cell is filled
           (or when resetting history to an earlier state)
        */
        this._winner = value // null, X or O
        this.domElements.message.textContent =
            this.isGameOver ? 'Winner' : 'Next player'

        if (this.isGameOver)
            this.domElements.player.textContent = CELL_DISPLAY[this.winner]

        const action = this.isGameOver ? 'add' : 'remove'
        this.domElements.game.classList[action]('game-over')
    }
    get winner() { return this._winner }

    set stateHistory(statesList) {
        /* Update the list of previous game states by creating a board for each step in the history.
           This field changes after a cell is filled  (or when resetting history to an earlier state)
         */
        this._history = statesList

        const pastBoards = this.stateHistory.map(state => this.createHistoryBoard(state))
        removeChildren(this.domElements.historyBoards)
        this.domElements.historyBoards.append(...pastBoards)

        // Scroll to bottom
        const container = this.domElements.history
        container.scrollTop = container.scrollHeight
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
            cell.domElement.classList.remove('winner')
        for (const [x, y] of coordinates) {
            const cell = this.cellMatrix[x][y]
            cell.domElement.classList.add('winner')
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
        const rowElements = fromState.cellStateMatrix.map(cellStateRow => {
            const cellElements = cellStateRow.map(cellState => {
                const cellElement = document.createElement('td')
                cellElement.textContent = CELL_DISPLAY[cellState]
                return cellElement
            })

            const rowElement = document.createElement('tr')
            rowElement.append(...cellElements)
            return rowElement
        })

        const boardElement = document.createElement('table')
        boardElement.classList.add('board')
        boardElement.onclick = () => this.resetToState(fromState)
        boardElement.append(...rowElements)
        return boardElement
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
