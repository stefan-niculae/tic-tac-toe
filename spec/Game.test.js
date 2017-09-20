import Game from '../src/Game'
import {CELL_STATES} from '../src/constants'


// Polyfill for `append`, source: https://github.com/jserz/js_piece/blob/master/DOM/ParentNode/append()/append().md
[Element.prototype,Document.prototype,DocumentFragment.prototype].forEach(function(e){e.hasOwnProperty("append")||Object.defineProperty(e,"append",{configurable:!0,enumerable:!0,writable:!0,value:function(){var e=Array.prototype.slice.call(arguments),t=document.createDocumentFragment();e.forEach(function(e){var n=e instanceof Node;t.appendChild(n?e:document.createTextNode(String(e)))}),this.appendChild(t)}})});


const GAMES_ROOT = document.createElement('games-root')
function gameWithState(str) {
    /* Helper function for generating a game and filling it with the board state described in the string
       Empty board:
        ...
        ...
        ...

        X wins:
        xo.
        ox.
        ..x
     */
    const lines = str.trim().split(/\n/)
    const game = new Game(lines.length, GAMES_ROOT)

    lines.forEach((line, i) => {
        line.trim().split('').forEach((char, j) => {
            const cell = game.cellMatrix[i][j]
            if      (char === 'x') cell.state = CELL_STATES.X
            else if (char === 'o') cell.state = CELL_STATES.O
            else                   cell.state = CELL_STATES.EMPTY
        })
    })

    return game
}

describe('searchWinningCoordinates', () => {
    /* Group test suites according to function */

    it('should find nothing on an empty board', () => {
        expect(gameWithState(`...
        ...
        ...
        `).searchWinningCoordinates()).toBeNull()
    })

    it('should find winner on a vertical line', () => {
        const game = gameWithState(`
        .x.
        .x.
        .x.
        `)
        /* Test the return value of the function, isolated from the value of game.winner */
        expect(game.searchWinningCoordinates()).not.toBeNull()
    })

    it('should find winner on a horizontal line', () => {
        const game = gameWithState(`
        xxx
        ...
        ...
        `)
        expect(game.searchWinningCoordinates()).not.toBeNull()
    })

    it('should find winner on a first diagonal', () => {
        const game = gameWithState(`
        x..
        .x.
        ..x
        `)
        expect(game.searchWinningCoordinates()).not.toBeNull()
    })

    it('should find winner on a first diagonal', () => {
        const game = gameWithState(`
        ..x
        .x.
        x..
        `)
        expect(game.searchWinningCoordinates()).not.toBeNull()
    })

    it('should find nothing when not enough symbols on a line', () => {
        const game = gameWithState(`
        xx.
        xx.
        ...
        `)
        expect(game.searchWinningCoordinates()).toBeNull()
    })

    it('should find winner when interspersed with other symbols', () => {
        const game = gameWithState(`
        xo.
        oxo
        .ox
        `)
        expect(game.searchWinningCoordinates()).not.toBeNull()
    })

    it('should find winner on a bigger board', () => {
        const game = gameWithState(`
        .....
        .xxx.
        .....
        .....
        .....
        `)
        expect(game.searchWinningCoordinates()).not.toBeNull()
    })

    it('should find winner when there are more symbols than necessary', () => {
        const game = gameWithState(`
        .....
        xxxxx
        .....
        .....
        .....
        `)
        expect(game.searchWinningCoordinates()).not.toBeNull()
    })
})
