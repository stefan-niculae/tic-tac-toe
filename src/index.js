import Game from './Game'

const GAMES_ROOT = document.getElementById('games')
const BUTTONS = document.getElementsByClassName('add-button')


for (let button of BUTTONS) {
    const size = button.getAttribute('data-game-size')
    button.onclick = () => new Game(+size, GAMES_ROOT)
}
