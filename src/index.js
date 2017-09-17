import $ from 'jquery'
import Game from './game'

const GAMES_ROOT = $('#games')
const BUTTONS = $('#create-game').find('button')


$(() => {
    for (let button of BUTTONS) {
        const $button = $(button)
        const size = $button.attr('data-game-size')
        $button.click(() => new Game(+size, GAMES_ROOT))
    }
})
