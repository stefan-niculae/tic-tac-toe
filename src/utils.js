function deepCopyArray(arr) {
    /* Not entirely deep */
    return Object.assign([], arr)
}

function range(n) {
    /* range(4) ~> [0, 1, 2, 3] */
    return [...(new Array(n).keys())] // proper use of Array(n), not ineffective
}

function head(array) {
    /* First element or null */
    return array.length === 0 ? null : array[0]
}

function parseHtml(templateString) {
    const parser = new DOMParser()
    return parser.parseFromString(templateString, 'text/html')
}

function removeChildren(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild)
    }
    return parent
}

export {
    deepCopyArray,
    range,
    head,
    parseHtml,
    removeChildren,
}
