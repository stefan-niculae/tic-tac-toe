import rippleOnClick from './ripple'
import {CELL_STATES, CELL_DISPLAY, GAME_PHASES} from './constants'


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
        if (this.game.phase === GAME_PHASES.OVER)
            return

        if (this.state !== CELL_STATES.EMPTY) // cell is already filled
            return
        this.state = this.game.currentPlayer // actually set the value

        rippleOnClick(clickEvent, this.domElement)
        // Make the cell look non-interactive after the ripple animation is done
        setTimeout(() => this.domElement.classList.add('noninteractive'), 500)

        this.game.advanceTurn()
    }
}

export default BoardCell
