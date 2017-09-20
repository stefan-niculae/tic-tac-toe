const CELL_STATES = Object.freeze({
    EMPTY: Symbol('Empty Cell'),
    X    : Symbol('X'),
    O    : Symbol('O'),
})

const CELL_DISPLAY = Object.freeze({
    [CELL_STATES.EMPTY]: '',
    [CELL_STATES.X]:     'X',
    [CELL_STATES.O]:     'O',
})


const GAME_PHASES = Object.freeze({
    ACTIVE: Symbol('Game Active'),
    OVER:   Symbol('Game Over'),
    DRAW:   Symbol('Draw'),
})
const STATUS_MESSAGES = Object.freeze({
    [GAME_PHASES.ACTIVE]: 'Next player: ',
    [GAME_PHASES.OVER]:   'Winner: ',
    [GAME_PHASES.DRAW]:   'Draw',
})
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

export {
    CELL_STATES,
    CELL_DISPLAY,
    GAME_PHASES,
    STATUS_MESSAGES,
    WINNING_LINES_DELTAS,
}
