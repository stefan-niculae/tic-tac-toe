import BoardCell from './BoardCell'
import {CELL_STATES, CELL_DISPLAY, GAME_PHASES, STATUS_MESSAGES, WINNING_LINES_DELTAS} from './constants'
import { deepCopyArray, range, head, parseHtml, removeChildren } from './utils'


class Game {
    /* Holds the game board (matrix of cells) and game status (game phase, next player and winner).
       Creates the DOM elements and defines how turns are advanced (fill board cell, switch players);
       how the game ends (finding a winning line and restricting interactivity)
       and how the game state is stored as history and reset.
     */

    constructor(boardSize, rootElement) {
        /* Initialize internal values and create DOM elements */
        this.boardSize = boardSize

        this.cellMatrix = this.createCells()
        this.domElements = this.createDomElements(rootElement)

        this.phase = GAME_PHASES.ACTIVE
        this.turnNumber = 1
        this.stateHistory = []

        this.addCurrentStateToHistory() // add the empty state
    }

    /** Initialization **/
    createCells() {
        /* Create the n by n matrix of (reflective) cells */
        return range(this.boardSize).map(_ => // create n rows
            range(this.boardSize).map(_ => new BoardCell(this)) // each containing n cell elements
        )
    }

    createDomElements(gamesRoot) {
        /* Create and insert the into the DOM elements for each part of the game */
        const template = `
          <article class="game">
            
            <div class="active-side">
              <p class="status">
                <span class="message"></span><span class="player"></span>
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
    set phase(value) {
        /* Update the displayed message and game class. This field changes when a winning line
           or a draw was detected after a cell is filled (or when resetting history to an earlier state)
        */
        this._phase = value

        if (this.phase === GAME_PHASES.ACTIVE)
            // Clear previous classes (over/draw)
            this.domElements.game.classList.remove('game-over', 'draw')
        else
            // Add the appropriate game over or draw class
            this.domElements.game.classList.add(
                this.phase === GAME_PHASES.OVER ? 'game-over' : 'draw'
            )

        this.domElements.message.textContent = STATUS_MESSAGES[this.phase]
    }
    get phase() { return this._phase }

    set turnNumber(value) {
        /* Update the displayed player symbol and place the current game state in the history.
           This field changes after a cell is filled (or when resetting history to an earlier state)
        */
        this._turnNumber = value
        this.domElements.player.textContent = CELL_DISPLAY[this.currentPlayer]

    }
    get turnNumber() { return this._turnNumber }

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
    get currentPlayer() {
        return this.turnNumber % 2 === 0 ?
            CELL_STATES.O :
            CELL_STATES.X
    }

    get flatCells() {
        /* Each cell in one flat array */
        const cellsByRow = range(this.boardSize).map(i =>
            range(this.boardSize).map(j => ({
                row: i,
                col: j,
                cell: this.cellMatrix[i][j]
            }))
        )
        return [].concat(...cellsByRow) // join all rows together
    }

    maybeGetCellState(row, col) {
        /* The value at the given row and column or null if out of bounds */
        const n = this.boardSize
        if (row < 0 || row >= n || col < 0 || col >= this.boardSize)
            return null
        return this.cellMatrix[row][col].state
    }


    /** Updating **/
    advanceTurn() {
        /* Switch players (X becomes O and vice-versa) and check if game is over or a draw */
        const winningCoordinates = this.searchWinningCoordinates()
        if (winningCoordinates !== null) { // actual winning line found
            this.phase = GAME_PHASES.OVER
            this.highlightWinner(winningCoordinates)
            return
        }

        this.turnNumber += 1
        if (this.turnNumber > this.boardSize * this.boardSize) {
            this.phase = GAME_PHASES.DRAW // means it's a draw
            return
        }

        this.addCurrentStateToHistory()
    }


    /** Win condition **/
    searchWinningCoordinates() {
        /* Return the coordinates of winning triplet of cells (and the symbol that won); null if there is none */
        const winningLinesInfo = this.flatCells // there can be multiple winning triplets at the same time
            .map(cellInfo => this.searchWinningNeighbors(cellInfo))
            .filter(winningLine => winningLine !== null)
        return head(winningLinesInfo) // first or null
    }

    searchWinningNeighbors({row, col, cell: center}) {
        /* Return the coordinates of the winning line (vertical/horizontal/ diagonals); null if there is none. */
        // There can't be a winner with an empty center (but there can be a hypothetical one
        if (center.state === CELL_STATES.EMPTY)
            return null

        const neighborLines = WINNING_LINES_DELTAS.map(lineDeltas => {
            const neighborCoordinates = lineDeltas.map(([dx, dy]) => [row + dx, col + dy])
            const neighborValues = neighborCoordinates.map(([x, y]) => this.maybeGetCellState(x, y))
            // We filter by the values but keep the coordinates
            return {neighborCoordinates, neighborValues}
        })

        // There can be multiple winning lines at a time (eg: vertically and horizontally)
        const winningLines = neighborLines.filter(({neighborCoordinates, neighborValues}) =>
            // All neighbors must have the same value as the center
            neighborValues.every(v => v === center.state),
        )

        if (winningLines.length === 0) // no winning lines found
            return null
        return [[row, col], ...winningLines[0].neighborCoordinates]
    }

    highlightWinner(coordinates) {
        /* Highlight the cells that caused the win */
        this.flatCells.forEach(({cell}) => cell
            .domElement.classList.remove('winner'))
        coordinates.forEach(([x, y]) => this.cellMatrix[x][y]
            .domElement.classList.add('winner'))
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
            phase:      this.phase,
            turnNumber: this.turnNumber,
            // The history array is not being saved, instead it will be truncated to previous turns
        }]
    }

    resetToState(pastState) {
        /* Replace the state of each cell, the next player and the winner and keep only previous history steps */
        for (const {row, col, cell} of this.flatCells)
            cell.state = pastState.cellStateMatrix[row][col]

        this.phase      = pastState.phase
        this.turnNumber = pastState.turnNumber

        const truncatedHistory = this.stateHistory.slice(0, pastState.turnNumber) // discard future steps
        this.stateHistory = deepCopyArray(truncatedHistory)
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

}

export default Game
