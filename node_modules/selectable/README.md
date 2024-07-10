Selectable
============

Turn anything into a selectable. Uses a an OS style drag box to select/deselect items. Documentation coming soon.

## Installation

    npm install selectable --save

## Usage

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


## Release History

* 0.1.0 Initial release