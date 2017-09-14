const NEED_TO_WIN = 3 // number of adjacent symbols needed to win
const DISPLAY_SYMBOL = (stateValue) => {
    // mapping from internal value to external display symbol
    if (stateValue === null) return ''
    if (stateValue ===  +1 ) return 'X'
    if (stateValue ===  -1 ) return 'O' // the letter O is more aesthetic than a zero
}


class GameBoard {
    constructor(size, root) {
        this.size = size
        this.elements = this.createBoard(root)

        this.initializeState()
        this.syncStatus()
    }

    // Initialization
    initializeState() {
        this.values = this.emptyValues()
        this.nextPlayer = +1  // X
        this.winner = null
    }

    emptyValues() {
        let state = []
        for (let i = 0; i < this.size; i++) {
            let row = new Array(this.size).fill(null) // different one each time
            state.push(row)
        }
        return state
    }

    createBoard(root) {
        // create the cell objects
        let cells = []
        for (let r = 0; r < this.size; r++) {
            let row = []
            for (let c = 0; c < this.size; c++) {
                let cell = $('<td>', {
                    click: () => this.fillCell(r, c)
                })
                row.push(cell)
            }
            cells.push(row)
        }

        // build and insert the elements into the DOM
        let rowElements = cells.map(rowCells =>
            $('<tr>').append(rowCells)
        )
        let board = $('<table>', {'class': 'game-board'}).append(rowElements)
        let status = $('<p>', {'class': 'game-status'})

        let game = $('<article>', {'class': 'game'})
            .append(board)
            .append(status)
        root.append(game)

        return { cells, board, status }
    }

    // Updating
    fillCell(row, col) {
        // do nothing if the game is over
        if (this.winner !== null)
            return

        let currentValue = this.values[row][col]
        // do nothing if the cell is already filled
        if (currentValue !== null)
            return

        // update the internal values and reflect the changes
        this.values[row][col] = this.nextPlayer // set current player
        this.nextPlayer *= -1 // switch players
        this.winner = this.findWinner()

        this.syncCells() // show symbols and highlights
        this.syncStatus() // show next player or winner
    }

    syncCells() {
        // reflect changes in this.values into the DOM elements, accessed through this.cells
        // and the next player

        let highlightWhom = (this.winner === null) ?
            this.nextPlayer : // highlight the next player if game in progress
            this.winner       // if game over, highlight the winner

        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                let value = this.values[r][c]
                let cell = this.elements['cells'][r][c]

                let symbol = DISPLAY_SYMBOL(value)
                cell.text(symbol)

                if (value === highlightWhom)
                    cell.addClass('highlighted')
                else
                    cell.removeClass('highlighted')
            }
        }
    }

    syncStatus() {
        let gameOver = (this.winner !== null)
        let message = gameOver ?
            'Winner: ' + DISPLAY_SYMBOL(this.winner) :
            'Next player: ' + DISPLAY_SYMBOL(this.nextPlayer)
        this.elements['status'].text(message)

        if (gameOver)
            this.elements['board'].addClass('game-over')
    }


    // Win condition
    findWinner() {
        let sums = [
            ...this.values,                // on each row
            ...transpose(this.values),     // on each column
            diagonal(this.values),         // on main diagonal
            diagonal(mirror(this.values)), // on secondary diagonal
        ].map(sum)

        let reachedRequired = sums.filter(sum => sum === NEED_TO_WIN)
        if (reachedRequired.length === 0)
            // no symbol reached the required number of occurrences to win
            return null
        else {
            console.assert(reachedRequired.length === 1,
                'There should be at most ONE symbol to reach the required number of occurrences', reachedRequired)
            return Math.sign(reachedRequired[0]) // +1 for a sum of 3, -1 for a sum of -3
        }
    }

}

let gamesRoot = $('#games')
var game = new GameBoard(3, gamesRoot)
