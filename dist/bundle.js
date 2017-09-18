!function(e){function t(r){if(n[r])return n[r].exports;var a=n[r]={i:r,l:!1,exports:{}};return e[r].call(a.exports,a,a.exports,t),a.l=!0,a.exports}var n={};t.m=e,t.c=n,t.d=function(e,n,r){t.o(e,n)||Object.defineProperty(e,n,{configurable:!1,enumerable:!0,get:r})},t.n=function(e){var n=e&&e.__esModule?function(){return e.default}:function(){return e};return t.d(n,"a",n),n},t.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},t.p="",t(t.s=0)}([function(e,t,n){"use strict";var r=n(1),a=function(e){return e&&e.__esModule?e:{default:e}}(r),i=document.getElementById("games"),s=document.getElementsByClassName("add-button"),l=!0,o=!1,u=void 0;try{for(var c,f=s[Symbol.iterator]();!(l=(c=f.next()).done);l=!0){var m=c.value;!function(e){var t=e.getAttribute("data-game-size");e.onclick=function(){return new a.default(+t,i)}}(m)}}catch(e){o=!0,u=e}finally{try{!l&&f.return&&f.return()}finally{if(o)throw u}}},function(e,t,n){"use strict";function r(e){if(Array.isArray(e)){for(var t=0,n=Array(e.length);t<e.length;t++)n[t]=e[t];return n}return Array.from(e)}function a(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}Object.defineProperty(t,"__esModule",{value:!0});var i=function(){function e(e,t){var n=[],r=!0,a=!1,i=void 0;try{for(var s,l=e[Symbol.iterator]();!(r=(s=l.next()).done)&&(n.push(s.value),!t||n.length!==t);r=!0);}catch(e){a=!0,i=e}finally{try{!r&&l.return&&l.return()}finally{if(a)throw i}}return n}return function(t,n){if(Array.isArray(t))return t;if(Symbol.iterator in Object(t))return e(t,n);throw new TypeError("Invalid attempt to destructure non-iterable instance")}}(),s=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),l=n(2),o=n(4);n(5);var u=[[[0,-1],[0,1]],[[-1,0],[1,0]],[[-1,-1],[1,1]],[[1,-1],[-1,1]]],c=function(){function e(t,n){a(this,e),this.size=t,this.cellMatrix=this.createCells(),this.domElements=this.createDomElements(n),this.winner=null,this.nextPlayer=l.CELL_STATES.X,this.stateHistory=[],this.addCurrentStateToHistory()}return s(e,[{key:"createCells",value:function(){var e=this;return(0,o.range)(this.size).map(function(t){return(0,o.range)(e.size).map(function(t){return new l.BoardCell(e)})})}},{key:"createDomElements",value:function(e){var t=(0,o.parseHtml)('\n          <article class="game">\n            \n            <div class="active-side">\n              <p class="status">\n                <span class="message"></span>: \n                <span class="player"></span>\n              </p>\n              \n              <table class="board">\n              </table>\n            </div>\n\n            <div class="history">\n              <p>History</p>\n              <div class="boards">\n              </div>\n            </div>       \n              \n          </article>\n        ').getElementsByClassName("game")[0],n=this.cellMatrix.map(function(e){return e.map(function(e){return e.domElement})}).map(function(e){var t=document.createElement("tr");return t.append.apply(t,r(e)),t}),a=t.getElementsByClassName("board")[0];a.append.apply(a,r(n)),e.appendChild(t);var i=t.getElementsByClassName("active-side")[0].scrollHeight;return t.getElementsByClassName("history")[0].style.height=i+"px",{game:t,message:t.getElementsByClassName("message")[0],player:t.getElementsByClassName("player")[0],history:t.getElementsByClassName("history")[0],historyBoards:t.getElementsByClassName("boards")[0]}}},{key:"maybeGetCellState",value:function(e,t){var n=this.size;return e<0||e>=n||t<0||t>=this.size?null:this.cellMatrix[e][t].state}},{key:"advanceTurn",value:function(){this.nextPlayer=this.nextPlayer===l.CELL_STATES.X?l.CELL_STATES.O:l.CELL_STATES.X;var e=this.findWinner();null!==e&&this.endGame(e)}},{key:"findWinner",value:function(){var e=this,t=this.flatCells.map(function(t){return e.findWinningLine(t)}).filter(function(e){return null!==e});return(0,o.head)(t)}},{key:"findWinningLine",value:function(e){var t=this,n=e.row,a=e.col,s=e.cell;if(s.state===l.CELL_STATES.EMPTY)return null;var o=u.map(function(e){var r=e.map(function(e){var t=i(e,2),r=t[0],s=t[1];return[n+r,a+s]});return{neighborCoordinates:r,neighborValues:r.map(function(e){var n=i(e,2),r=n[0],a=n[1];return t.maybeGetCellState(r,a)})}}),c=o.filter(function(e){e.neighborCoordinates;return e.neighborValues.every(function(e){return e===s.state})});return 0===c.length?null:{player:s.state,coordinates:[[n,a]].concat(r(c[0].neighborCoordinates))}}},{key:"endGame",value:function(e){var t=e.player,n=e.coordinates;this.winner=t,this.highlightWinner(n)}},{key:"highlightWinner",value:function(e){var t=!0,n=!1,r=void 0;try{for(var a,s=this.flatCells[Symbol.iterator]();!(t=(a=s.next()).done);t=!0){a.value.cell.domElement.classList.remove("winner")}}catch(e){n=!0,r=e}finally{try{!t&&s.return&&s.return()}finally{if(n)throw r}}var l=!0,o=!1,u=void 0;try{for(var c,f=e[Symbol.iterator]();!(l=(c=f.next()).done);l=!0){var m=c.value,y=i(m,2),h=y[0],d=y[1];this.cellMatrix[h][d].domElement.classList.add("winner")}}catch(e){o=!0,u=e}finally{try{!l&&f.return&&f.return()}finally{if(o)throw u}}}},{key:"addCurrentStateToHistory",value:function(){var e=this.cellMatrix.map(function(e){return e.map(function(e){return e.state})});this.stateHistory=[].concat(r(this.stateHistory),[{cellStateMatrix:e,nextPlayer:this.nextPlayer,winner:this.winner,stepNumber:this.stateHistory.length}])}},{key:"createHistoryBoard",value:function(e){var t=this,n=e.cellStateMatrix.map(function(e){var t=e.map(function(e){var t=document.createElement("td");return t.textContent=l.CELL_DISPLAY[e],t}),n=document.createElement("tr");return n.append.apply(n,r(t)),n}),a=document.createElement("table");return a.classList.add("board"),a.onclick=function(){return t.resetToState(e)},a.append.apply(a,r(n)),a}},{key:"resetToState",value:function(e){var t=!0,n=!1,r=void 0;try{for(var a,i=this.flatCells[Symbol.iterator]();!(t=(a=i.next()).done);t=!0){var s=a.value,l=s.row,u=s.col;s.cell.state=e.cellStateMatrix[l][u]}}catch(e){n=!0,r=e}finally{try{!t&&i.return&&i.return()}finally{if(n)throw r}}this.nextPlayer=e.nextPlayer,this.winner=e.winner;var c=this.stateHistory.slice(0,e.stepNumber+1);this.stateHistory=(0,o.deepCopyArray)(c)}},{key:"nextPlayer",set:function(e){this._nextPlayer=e,this.domElements.player.textContent=l.CELL_DISPLAY[this.nextPlayer]},get:function(){return this._nextPlayer}},{key:"winner",set:function(e){this._winner=e,this.domElements.message.textContent=this.isGameOver?"Winner":"Next player",this.isGameOver&&(this.domElements.player.textContent=l.CELL_DISPLAY[this.winner]);var t=this.isGameOver?"add":"remove";this.domElements.game.classList[t]("game-over")},get:function(){return this._winner}},{key:"stateHistory",set:function(e){var t,n=this;this._history=e;var a=this.stateHistory.map(function(e){return n.createHistoryBoard(e)});(0,o.removeChildren)(this.domElements.historyBoards),(t=this.domElements.historyBoards).append.apply(t,r(a));var i=this.domElements.history;i.scrollTop=i.scrollHeight},get:function(){return this._history}},{key:"flatCells",get:function(){var e,t=this,n=(0,o.range)(this.size).map(function(e){return(0,o.range)(t.size).map(function(n){return{row:e,col:n,cell:t.cellMatrix[e][n]}})});return(e=[]).concat.apply(e,r(n))}},{key:"isGameOver",get:function(){return null!==this.winner}}]),e}();t.default=c},function(e,t,n){"use strict";function r(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function a(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}Object.defineProperty(t,"__esModule",{value:!0}),t.BoardCell=t.CELL_DISPLAY=t.CELL_STATES=void 0;var i,s=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),l=n(3),o=function(e){return e&&e.__esModule?e:{default:e}}(l),u=Object.freeze({EMPTY:Symbol("Empty Cell"),X:Symbol("X"),O:Symbol("O")}),c=Object.freeze((i={},a(i,u.EMPTY,""),a(i,u.X,"X"),a(i,u.O,"O"),i)),f=function(){function e(t){var n=this;r(this,e),this._state=u.EMPTY,this.game=t,this.domElement=document.createElement("td"),this.domElement.classList+="ripple",this.domElement.onclick=function(e){return n.fillCell(e)}}return s(e,[{key:"fillCell",value:function(e){var t=this;this.game.isGameOver||this.state===u.EMPTY&&(this.state=this.game.nextPlayer,(0,o.default)(e,this.domElement),setTimeout(function(){return t.domElement.classList.add("noninteractive")},500),this.game.advanceTurn(),this.game.addCurrentStateToHistory())}},{key:"state",set:function(e){this._state=e,this.domElement.textContent=c[e],e===u.EMPTY&&this.domElement.classList.remove("noninteractive")},get:function(){return this._state}}]),e}();t.CELL_STATES=u,t.CELL_DISPLAY=c,t.BoardCell=f},function(e,t,n){"use strict";function r(e,t){var n=e.getElementsByClassName(t);if(n.length>0)return n[0];var r=document.createElement("div");return r.classList.add(t),e.prepend(r),r}function a(e,t){var n=r(t,"ink");n.classList.remove("animate");var a=Math.max(t.offsetHeight,t.offsetWidth)+"px";n.style.height=a,n.style.width=a;var i=e.pageX-t.offsetLeft-n.offsetWidth/2,s=e.pageY-t.offsetTop-n.offsetHeight/2;n.style.left=i+"px",n.style.top=s+"px",n.classList.add("animate")}Object.defineProperty(t,"__esModule",{value:!0}),t.default=a},function(e,t,n){"use strict";function r(e){if(Array.isArray(e)){for(var t=0,n=Array(e.length);t<e.length;t++)n[t]=e[t];return n}return Array.from(e)}function a(e){return Object.assign([],e)}function i(e){return[].concat(r(new Array(e).keys()))}function s(e){return 0===e.length?null:e[0]}function l(e){return(new DOMParser).parseFromString(e,"text/html")}function o(e){for(;e.firstChild;)e.removeChild(e.firstChild);return e}Object.defineProperty(t,"__esModule",{value:!0}),t.deepCopyArray=a,t.range=i,t.head=s,t.parseHtml=l,t.removeChildren=o},function(e,t){}]);
//# sourceMappingURL=bundle.js.map