// BEFORE MAKING THESE PLUGINS -- GAME PLAN
// specify they are open source and that they are all free time products, more help from the community will fuel their growth

// GOAL:
// https://dribbble.com/shots/2035675-Multiple-Selections-Screen?list=users&offset=0

// RESOURCES:
// https://github.com/component/selectable/blob/master/index.js
// https://jqueryui.com/selectable/#display-grid
// http://unclecheese.github.io/react-selectable/example/
// https://github.com/endel/jquery.selectable.js/blob/master/src/jquery.selectable.js
// https://github.com/anovi/selectonic
// http://threedubmedia.com/code/event/drop/demo/selection
// http://threedubmedia.com/code/event/drag
// http://jsfiddle.net/qGzkG/2/
// https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection
// http://nightlycoding.com/index.php/2014/02/click-and-drag-multi-selection-rectangle-with-javascript/
// 
// http://chris-armstrong.com/late/ ~~~ should write a game like this in just HTML/CSS/JS!!!
// https://msdn.microsoft.com/en-us/library/ie/gg589497(v=vs.85).aspx
 
// TODOS:
//  callbacks
//  keyboard support - tabbing through selectable items? provide a keyboard-shortcut option to allow what key binding to use, select all crtl+a
//  bounds for selecting - what is the canvas to select off of (defaults to window)
//  handle transition out for select box after dragUp
//  filter somehow

// think of checkbox functionality, if one is only allowed then the others should be greyed out? some state that only 3 allowed.
// like a little 1/3 thing showing allowed number
class Selectables {

    constructor(elements) { // accepts a list or query of items to deem selectable

        this.options = {
            textSelection: false, // allows text to be selected as normal and the use of shift + click to select, pass number of modifier to change from shift
            focusBlur: true, // clears focus when clicked outside of list
            list: window, // specify what bounds the dragBox should have, defaults to window
            multi: false, // allow multiple items to be selected at once, can pass number for allowing up to three to be selected
            autoScroll: false, // scroll and drag to select elements (useful for large amount of selectables) also works when tabbing with keyboard
            loop: false, // when reaching bottom of list it will begin with number one
            selectBox: true, // creates a fixed svg around the element with an id associated with it
            dragSelect: true, // creates a OS type select box to select a group of selectables
            keyboard: false, // use keyboard to navigate through selectable items
            delay: 350, // delay on how long before 
            handle: '.handle', // false or name of selector to query OR data-selectable=".this" pass to use a selector as a handle
            accessible: true, // creates aria-tags to make it accessible friendly
            focusedWhileDragging: true, // focus elements while dragging over them
            tabIndex: false, // puts an tab index on element, this overrides keyboardNav to false
            listClass: 'selectable-list',
            focusClass: 'focused',
            selectedClass: 'selected',
            disabledClass: 'disabled',
        };

        this.selectables = elements;
        this.body = document.body;
        this.count = elements.length;

        // drag to select functionality
        this.dragBox = this.createSVG('svg', { viewBox: '0 0 0 0', width: 0, height: 0 });
        this.dragRect = this.createSVG('rect', { width: '100%', height: '100%' });

        // cross-browser
        this.transform = this.getPropPrefix('transform');

        // custom events
        this.selectAllEvent = new Event('select:all');
        this.deselectAllEvent = new Event('deselect:all');

        this.startX =
        this.startY =
        this.deltaX =
        this.deltaY =
        this.transX =
        this.transY =
        this.rafID =
        this.dragStartHandler =
        this.dragMoveHandler =
        this.dragEndHandler = null;

        this.isKeydown =
        this.isDragging = false;

        this.init();
    }

    init() {

        if(this.options.dragSelect) {
            // add rectangle to svg
            this.dragBox.appendChild(this.dragRect);

            // add svg to DOM
            this.body.appendChild(this.dragBox);
        }

        this.bindEvents();
    }

    bindEvents() {
        
        // listen for drag start
        if(this.options.dragSelect) {
            this.dragStartHandler = e => this.dragStart(e);
            window.addEventListener('mousedown', this.dragStartHandler);
        }

        // handle keydown
        window.addEventListener('keydown', e => {
            // listen for shift or cmnd key
            if(e.keyCode === 16 || e.keyCode === 91) {
                this.isKeydown = true;
            }
        });

        window.addEventListener('keyup', e => {
            // listen for shift or cmnd key
            if(e.keyCode === 16 || e.keyCode === 91) {
                this.isKeydown = false;
            }
        });
    }

    findSelectables() {
        
        var a = this.dragBox.getBoundingClientRect();
        
        // loop through and check if any selectables are colliding with drag box
        for(var i = this.selectables.length; i--;) {
            
            var selectable = this.selectables[i],
                b = selectable.getBoundingClientRect();
            
            if(this.isColliding(a, b)) {
                // if key is down and we aren't dragging then we need to toggle
                // instead of selecting just one
                if(this.isKeydown && this.isDragging) {
                    this.toggleOne(selectable);
                }
                else {
                    this.selectOne(selectable);
                }
            } else {
                // if nothing collided and key isn't down then deselect item
                if(!this.isKeydown) {
                    this.deselectOne(selectable);
                }
            }
        }
    }

    updateDragSelect() {
        
        var width = this.deltaX || 0,
            height = this.deltaY || 0;
        
        // update position
        this.dragBox.style[this.transform] = 'translate('+ this.transX +'px, '+ this.transY +'px)';
        
        // update width/height
        this.setSVGAtts(this.dragBox, {
            viewBox: '0 0 '+ width +' '+ height,
            width: width,
            height: height
        });
        
        // keep updating
        this.rafID = requestAnimationFrame(() => this.updateDragSelect());
    }

    dragStart(e) {
        
        // get starting coords
        this.startX = e.pageX;
        this.startY = e.pageY;
        
        // add helper styling class
        this.body.classList.add('dragging');
        
        // listen for drag and release
        this.dragMoveHandler = e => this.dragMove(e);
        this.dragEndHandler = e => this.dragEnd(e);

        window.addEventListener('mousemove', this.dragMoveHandler);
        window.addEventListener('mouseup', this.dragEndHandler);
        
        // start animating
        this.rafID = requestAnimationFrame(() => this.updateDragSelect());
    }

    dragMove(e) {

        // now we're dragging
        this.isDragging = true;
        
        // get current relative to start coords
        this.deltaX = Math.abs(e.pageX - this.startX);
        this.deltaY = Math.abs(e.pageY - this.startY);
        
        // check if we need to move position
        this.transX = (this.startX > e.pageX) ? (this.startX - this.deltaX) : this.startX;
        this.transY = (this.startY > e.pageY) ? (this.startY - this.deltaY) : this.startY;
    }

    dragEnd(e) {

        // make sure this was a drag
        if(this.isDragging) {

            // clear current drag box animation
            cancelAnimationFrame(this.rafID);

            // check if we selected anything
            this.findSelectables();

            // reset attributes on release
            this.deltaX =
            this.deltaY = 0;
            this.setSVGAtts(this.dragBox, { viewBox: '0 0 0 0', width: 0, height: 0 });

            // remove helper styling class
            this.body.classList.remove('dragging');

            // we've stopped dragging
            this.isDragging = false;
        }
        else {
            // if we aren't trying select additional selectables only select one
            if(!this.isKeydown) {
                this.deselectAll();
                this.selectOne(e.target);
            }
            else {
                this.toggleOne(e.target);
            }
        }
        
        // remove drag move and drag end listeners
        window.removeEventListener('mousemove', this.dragMoveHandler);
        window.removeEventListener('mouseup', this.dragEndHandler);
    }

    addSelectable() {

    }

    removeSelectable() {

    }

    selectOne(el) {
        el.classList.add('selected');
        //el.dispatchEvent('selected');
    }

    deselectOne(el) {
        el.classList.remove('selected');
        //el.dispatchEvent('deselected');
    }

    toggleOne(el) {
        console.log('test');
        if(el.classList.contains('selected')) {
            this.deselectOne(el);
        }
        else {
            this.selectOne(el);
        }
    }

    selectAll() {
        for(let i = this.selectables.length; i--;) {
            this.selectables[i].classList.add('selected');
        }
    }

    deselectAll() {
        for(let i = this.selectables.length; i--;) {
            this.selectables[i].classList.remove('selected');
        }

        // fire event (use "list" or wrapper as default where to fire event on)
        window.dispatchEvent(this.deselectAllEvent);
    }

    toggleAll() {
        if(this.anySelected) {
            this.deselectAll();
        } else {
            this.selectAll();
        }
    }

    // checks if two elements are colliding
    // abstracted from: https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection
    isColliding(a, b) {
        return (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top);
    }

    setSVGAtts(el, atts) {
        if(atts !== undefined) {
            for(var k in atts) {
                el.setAttributeNS(null, k, atts[k]);
            }
        }
        return el;
    }

    createSVG(tag, atts) {
      var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
      return this.setSVGAtts(el, atts);
    }

    getPropPrefix(prop) {

        var styles = document.createElement('p').style,
            vendors = ['ms', 'O', 'Moz', 'Webkit'], i;

        if(styles[prop] === '') return prop;

        prop = prop.charAt(0).toUpperCase() + prop.slice(1);

        for(i = vendors.length; i--;) {
            if(styles[vendors[i] + prop] === '') {
                return (vendors[i] + prop);
            }
        }
    }
}

var selectables = document.querySelectorAll('[data-selectable]'),
    selectableList = new Selectables(selectables),
    toggleSelectables = document.querySelector('.toggle-selectables');

// toggle all selectables with a checkbox
toggleSelectables.addEventListener('change', function () {
    if(this.checked) {
        selectableList.selectAll();
    }
    else {
        selectableList.deselectAll();
    }
});

window.addEventListener('deselect:all', function () {
    toggleSelectables.checked = false;
});