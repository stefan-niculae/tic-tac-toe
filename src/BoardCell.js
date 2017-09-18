import rippleOnClick from './ripple'


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


class BoardCell {
    /* Reflects changes to internal state in the DOM element */
    constructor(game) {
        this._state = CELL_STATES.EMPTY
        this.game = game

        this.domElement = document.createElement('td')
        this.domElement.classList += 'ripple'
        this.domElement.onclick = (e) => this.fillCell(e)
    }
    set state(value) {
        /* Show the corresponding symbol */
        this._state = value
        this.domElement.textContent = CELL_DISPLAY[value]

        if (value === CELL_STATES.EMPTY)  // empty cell
            // It will be turned noninteractive when the animation ends
            this.domElement.classList.remove('noninteractive')
    }
    get state() { return this._state }

    fillCell(clickEvent) {
        /* Register the click, updating the game state */
        if (this.game.isGameOver)
            return

        if (this.state !== CELL_STATES.EMPTY) // cell is already filled
            return
        this.state = this.game.nextPlayer // actually set the value

        rippleOnClick(clickEvent, this.domElement)
        // Make the cell look non-interactive after the ripple animation is done
        setTimeout(() => this.domElement.classList.add('noninteractive'), 500)

        this.game.advanceTurn()
        this.game.addCurrentStateToHistory()
    }
}

export {
    CELL_STATES,
    CELL_DISPLAY,
    BoardCell
}
