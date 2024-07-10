// TODOS:
//  handle transition out for select box after dragUp
//  add cmnd + click || shift + click to select more elements

// SVG Helper
"use strict";

var setSVGAtts = function setSVGAtts(el, atts) {
    if (atts !== undefined) {
        for (var k in atts) {
            el.setAttributeNS(null, k, atts[k]);
        }
    }
    return el;
},
    createSVG = function createSVG(tag, atts) {

    var el = document.createElementNS("http://www.w3.org/2000/svg", tag);

    // set SVG attributes
    setSVGAtts(el, atts);

    return el;
},
    selectables = document.querySelectorAll("[data-selectable]"),
    startX,
    startY,
    deltaX,
    deltaY,
    transX,
    transY,
    rafID;

var body = document.body,
    svg = createSVG("svg", { viewBox: "0 0 0 0", width: 0, height: 0 }),
    rect = createSVG("rect", { width: "100%", height: "100%" }),
    isDragging = false;

// add rect to svg
svg.appendChild(rect);

// add svg to DOM
body.appendChild(svg);

// checks if anything is selected within set of x and y ranges
function findSelectables() {

    var a = svg.getBoundingClientRect();

    for (var i = selectables.length; i--;) {

        var selectable = selectables[i],
            b = selectable.getBoundingClientRect();

        if (isColliding(a, b)) {
            selectable.classList.add("selected");
        } else {
            selectable.classList.remove("selected");
        }
    }
}

// checks if two elements are colliding
// abstracted from: https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection
function isColliding(a, b) {
    return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function updateDragSelectBoxPos(e) {

    var width = deltaX || 0,
        height = deltaY || 0;

    // set position of svg
    svg.style.transform = "translate(" + transX + "px, " + transY + "px)";

    // svg width / height
    setSVGAtts(svg, {
        viewBox: "0 0 " + width + " " + height,
        width: width,
        height: height
    });

    // do we need to update
    if (isDragging) {
        rafID = requestAnimationFrame(updateDragSelectBoxPos);
    }
}

function dragStart(e) {

    // get starting coords
    startX = e.pageX;
    startY = e.pageY;

    // add helper styling class
    body.classList.add("dragging");

    // listen for drag and release
    window.addEventListener("mousemove", dragMove);
    window.addEventListener("mouseup", dragUp);

    // start animating
    rafID = requestAnimationFrame(updateDragSelectBoxPos);

    // now we're dragging
    isDragging = true;
}

function dragMove(e) {

    // get current relative to start coords
    deltaX = Math.abs(e.pageX - startX);
    deltaY = Math.abs(e.pageY - startY);

    // check if we need to move position
    transX = startX > e.pageX ? startX - deltaX : startX;
    transY = startY > e.pageY ? startY - deltaY : startY;
}

function dragUp(e) {

    // we've stopped dragging
    isDragging = false;

    // check if we selected anything
    findSelectables();

    // clear current animation
    cancelAnimationFrame(rafID);

    // reset atts on release
    deltaX = deltaY = 0;
    setSVGAtts(svg, { viewBox: "0 0 0 0", width: 0, height: 0 });

    // remove helper styling class
    body.classList.remove("dragging");

    window.removeEventListener("mousemove", dragMove);
    window.removeEventListener("mouseup", dragUp);
}

// listen for click
function selectableClickHandler(e) {
    if (!isDragging) {
        // remove selected class from all selectables
        for (var i = selectables.length; i--;) {
            selectables[i].classList.remove("selected");
        }
        e.target.classList.add("selected");
    }
}

for (var i = selectables.length; i--;) {

    var selectable = selectables[i];

    selectable.addEventListener("click", selectableClickHandler);
}

// listen for drag start
window.addEventListener("mousedown", dragStart);