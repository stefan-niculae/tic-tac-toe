import $ from 'jquery'


function deepCopyArray(arr) {
    return $.extend(true, [], arr)
}

function range(n) {
    /* range(4) ~> [0, 1, 2, 3] */
    return [...(new Array(n).keys())] // TODO: alternative to Array(n)
}

function head(array) {
    /* First element or null */
    return array.length === 0 ? null : array[0]
}

export {
    deepCopyArray,
    range,
    head,
}
