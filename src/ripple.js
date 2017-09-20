function getOrCreate(parent, className) {
    const elements = parent.getElementsByClassName(className)

    if (elements.length > 0)
        return elements[0]

    const element = document.createElement('div')
    element.classList.add(className)
    parent.prepend(element)
    return element
}

function rippleOnClick(event, surface) {
    /* Material Ripple effect
       https://github.com/balintsoos/material-ripple
    */

    // Create .ink element if it doesn't exist
    const ink = getOrCreate(surface, 'ripple-ink')

    // In case of quick double clicks stop the previous animation
    ink.classList.remove('animate');

    // Set size of .ink
    // Use surface's width or height whichever is larger for
    // the diameter to make a circle which can cover the entire element
    let diameter = Math.max(surface.offsetHeight, surface.offsetWidth) + 'px'
    ink.style.height = diameter
    ink.style.width  = diameter

    // Cet click coordinates
    // click coordinates relative to page minus
    // surface's position relative to page minus
    // half of self height/width to make it grow from pageY center
    let x = event.pageX - surface.offsetLeft - (ink.offsetWidth  / 2)
    let y = event.pageY - surface.offsetTop  - (ink.offsetHeight / 2)

    //set the position and add class .animate
    ink.style.left = x + 'px'
    ink.style.top  = y + 'px'
    ink.classList.add('animate')
}

export default rippleOnClick
