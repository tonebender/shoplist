/* jshint esversion: 6 */

const shoplist = (function () {

    const STATES = {
        grey: 0,
        black: 1,
        green: 2,
        yellow: 3,
        red: 4
    };

    class Item {
        constructor(text = '', category = 'Övrigt', amount = 1, state = STATES.black) {
            this.id = this._createRandomId();
            this.text = text;
            this.category = category;
            this.amount = amount;
            this.state = state;
        }

        /**
         * Return a 6-character string with 'i' + random chars from [0-9a-z]
         * (a non-number is needed at beginning because html IDs cannot start with nums)
         */
        _createRandomId () {
            return 'i' + (Math.random().toString(36)+'00000000000000000').slice(2, 7);
        }
    }

    const model = {

        // The working copy of the shopping list
        list: {},

        // The shopping list loaded from the server
        listFromServer: {},

        listname: '',

        // TODO: Remove ID from the Item objects and only use them as property keys;
        // move _createRandomId to here. And eliminate all cases of item.id everywhere.
        addItem: function (text, category, amount) {
            const item = new Item(text, category, amount);
            this.list.items[item.id] = item;
            return this.list.items[item.id];
        },

        removeItem: function (id) {
            delete this.list.items[id];
        },

        removeAll: function () {
            this.list.items = {};
        },

        // TODO: Change these set functions to setters in the Item class?
        setItemState: function (id, state) {
            this.list.items[id].state = state;
        },

        setItemCategory: function (id, category) {
            this.list.items[id].category = category;
        },

        updateListTime: function () {
            this.list.time = new Date().toLocaleString('sv-SE');
        },

        /**
         * Count how many items in the list that have a certain category
         *
         * @param {string} cat - the category to look for in the list items
         * @returns {number} how many items that have the category
         */
        countCategorysItems: function (cat) {
            return Object.keys(this.list.items)
                .filter(k => this.list.items[k].category === cat)
                .length;
        },

        /**
         * Load the shopping list specified in model.listname from the server
         * backend and give the results (JSON format) as parameter to the callWhenDone callback.
         *
         * @param {function} callWhenDone - function to call after loading succeeded.
         * Should take one argument which will be the responseText from the request.
         */
        loadFromServer: function (callWhenDone) {
            const xhr = new XMLHttpRequest();
            xhr.addEventListener('load', function () {
                if (this.status === 200) {
                    const payload = JSON.parse(this.responseText);
                    if (payload.hasOwnProperty('error')) {
                        controller.log(payload.error);
                    } else {
                        if (callWhenDone) callWhenDone(payload);
                    }
                } else {
                    controller.log('Error: ' + this.status);
                }
            });
            xhr.open('GET', '/load/' + model.listname);
            xhr.send();
        },

        /**
         * Save the shopping list specified in model.listname to the server backend.
         *
         * @param {object} list - the shopping list to save as JSON
         * @param {function} callWhenDone - callback to run when saving has succeeded
         */
        saveToServer: function (list, callWhenDone) {
            const xhr = new XMLHttpRequest();
            xhr.addEventListener('load', function () {
                if (xhr.status === 200) {
                    if (callWhenDone) callWhenDone();
                }
            });
            xhr.open('POST', '/save/' + model.listname);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify(list));
        },

        /**
         * Check if list one has a later time stamp than list two.
         *
         * @param {object} one - shopping list one
         * @param {object} two - shopping list two
         * @param {boolean} orEqual - also return true if time stamps are equal
         * @returns {boolean} true if list one is newer than list two, otherwise false
         */
        isNewer: function (one, two, orEqual=false) {
            const d1 = new Date(one.time);
            const d2 = new Date(two.time);
            if (orEqual) return d1.getTime() >= d1.getTime();
            return d1.getTime() > d2.getTime();
        },

        /**
         * Load the shopping list from the server to model.listFromServer and model.list
         * (asking to overwrite if applicable).
         */
        loadList: function () {
            model.loadFromServer((payload) => {
                if (model.list.hasOwnProperty('time')) {
                    // TODO: Check if current list is non-empty and not the same as on server.
                    // If so, ask for confirmation.
                }
            });
        },

        /**
         * Save the current shopping list to the server (after checking)
         */
        saveList: function () {
            // Load the current list on server and check if it is newer than what we last
            // got from the server; if not, we can save our working copy, overwriting the one
            // on the server.
            model.loadFromServer((listOnServer) => {
                if (isNewer(listOnServer, model.listFromServer)) {
                    console.log('List on server has changed since we loaded it!');
                    // TODO: to ask the user what to do
                } else {
                    model.saveToServer(model.list);  // TODO: Add callback
                }
            });
        }
    },

    view = {

        /**
         * Load the needed DOM elements into properties here in view.
         */
        getDOMElements: function () {
            const elements = [
                'shoplist',
                'listname',
                'messages',
                'btnNewItem',
                'dialogNewItem',
                'newItemText',
                'newItemCategory',
                'newItemAmount',
                'btnNewItemAdd'
            ];
            elements.map(elemID => {
                view[elemID] = document.querySelector('#' + elemID);
            });
        },

        /**
         * Set several attributes at once on a DOM element.
         *
         * @param {object} el - the HTML element
         * @param {object} attrs - an object with key-value pairs for all the attributes to set
         */
        setAttrs: function (el, attrs) {
            Object.keys(attrs)
                .filter(key => el[key] !== undefined)
                .forEach(key =>
                    typeof attrs[key] === 'object' ? Object.keys(attrs[key])
                    .forEach(innerKey => el[key][innerKey] = attrs[key][innerKey])
                    : el[key] = attrs[key]
                );
        },

        setTitle: function (title) {
            const titleElem = document.querySelector('#listtitle');
            titleElem.textContent = title;
        },

        /**
         * Create a category DOM element.
         *
         * @param {string} categoryKey - the variable name of the category (key in key-value)
         * @param {string} categoryValue - the actual category text (value in key-value)
         * @returns {object} the category LI element which contains a UL for its items
         */
        createCategory: function (category, dropCallback) {
            const catLi = document.createElement('li');
            catLi.setAttribute('id', category);
            catLi.classList.add('category');
            const catTextDiv = document.createElement('div');
            catTextDiv.textContent = category;
            catTextDiv.classList.add('categorytext');
            catLi.append(catTextDiv);
            const catUl = document.createElement('ul');
            catLi.append(catUl);
            // Events so that an item can be dragged into this category
            catLi.addEventListener('dragenter', e => { e.preventDefault(); });
            catLi.addEventListener('dragover', e => { e.preventDefault(); });
            catLi.addEventListener('drop', e => {
                const id = e.dataTransfer.getData('text/plain');
                const dragged = document.getElementById(id);
                catUl.appendChild(dragged);
            });
            return catLi;
        },

        /**
         * Create a shopping list DOM element.
         *
         * @param {string} id - the element's id attribute
         * @param {string} value - the element's value attribute
         * @param {string} amountValue - the value of the amount input box
         * @returns {object} the HTML element
         */
        _createItem: function (id, value, amountValue) {
            const item = document.createElement('li'),
                text = document.createElement('input'),
                amount = document.createElement('input'),
                btnItemDel = document.createElement('button'),
                btnItemGreen = document.createElement('button'),
                btnItemRed = document.createElement('button'),
                btnItemYellow = document.createElement('button'),
                btnItemGrey = document.createElement('button');
            item.className = 'item';
            text.className = 'text';
            amount.className = 'amount';
            btnItemDel.classList.add('itembtn', 'del');
            btnItemGreen.classList.add('itembtn', 'green');
            btnItemYellow.classList.add('itembtn', 'yellow');
            btnItemRed.classList.add('itembtn', 'red');
            btnItemGrey.classList.add('itembtn', 'grey');
            view.setAttrs(item, {id: id, draggable: 'true'});
            view.setAttrs(text, {type: 'text', id: id + '_text', value: value});
            view.setAttrs(amount, {type: 'text', id: id + '_amount', value: amountValue});
            view.setAttrs(btnItemDel, {type: 'button', id: id + '_del'});
            view.setAttrs(btnItemGreen, {type: 'button', id: id + '_green'});
            view.setAttrs(btnItemRed, {type: 'button', id: id + '_red'});
            view.setAttrs(btnItemYellow, {type: 'button', id: id + '_yellow'});
            view.setAttrs(btnItemGrey, {type: 'button', id: id + '_grey'});
            item.append(btnItemDel);
            item.append(btnItemGreen);
            item.append(btnItemYellow);
            item.append(btnItemRed);
            item.append(btnItemGrey);
            item.append(text);
            item.append(amount);
            return item;
        },

        /**
         * Show an item in the list on the page, putting it in its proper
         * category, rendering the category element if it didn't already exist.
         *
         * @param {object} i - the item object (from model.list.items) to render
         */
        renderItem: function (i) {
            const itemElem = view._createItem(i.id, i.text, i.amount);
            let categoryElem = document.getElementById(i.category);
            if (!categoryElem) {
                categoryElem = view.createCategory(i.category);
                view.shoplist.append(categoryElem);
            }
            categoryUl = categoryElem.querySelector('ul');
            categoryUl.append(itemElem);
            return itemElem;
        },

        /**
         * Remove element from the DOM (not only list items).
         *
         * @param {string} id - the ID of the elem to remove
         */
        removeElem: function (id) {
            const elem = document.querySelector('#' + id);
            elem.remove();
        },

        setItemEvents: function (iElem, btnCallbacks, dragendCallback) {
            Object.keys(btnCallbacks).forEach(key => {
                const btn = iElem.querySelector('#' + iElem.id + '_' + key);
                btn.addEventListener('click', btnCallbacks[key].bind(iElem));
            });
            iElem.addEventListener('dragstart', e => {
                e.dataTransfer.setData('text/plain', e.target.id);
            });
            iElem.addEventListener('dragend', dragendCallback);
        },

        setItemState: function (iElem, state) {
            if (iElem.classList.contains(state)) {
                iElem.classList.remove(state, 'marked');
            } else {
                iElem.classList.remove('green', 'yellow', 'red', 'grey');
                iElem.classList.add(state, 'marked');
            }
        },

        /**
         * Show/hide the dialog to add a new shoplist item.
         */
        showNewItemDialog: function (e) {
            e.stopPropagation();
            view.dialogNewItem.classList.add('shown');
        },
        hideNewItemDialog: function () {
            view.dialogNewItem.classList.remove('shown');
        }

    },

    controller = {

        /**
         * Initialize this JS app: set DOM element variables, load a shoplist, etc.
         * This should be run when the DOM is ready after page load.
         */
        init: function () {
            view.getDOMElements();
            controller.setStaticEvents();
            model.listname = view.listname.value;
            if (model.listname) model.loadFromServer(function (payload) {
                model.listFromServer = payload;
                model.list = structuredClone(model.listFromServer);
                view.setTitle(model.listname);
                Object.values(model.list.items).forEach(item => {
                    const iElem = view.renderItem(item);
                    view.setItemEvents(iElem, controller.btnCallbacks, controller.dragendCallback);
                });
            });
        },

        /**
         * Set click events on the static elements on page.
         */
        setStaticEvents: function () {
            view.btnNewItem.addEventListener('click', view.showNewItemDialog);
            const body = document.querySelector('body');
            body.addEventListener('click', view.hideNewItemDialog);
            view.btnNewItemAdd.addEventListener('click', () => {
                controller.addNewItem(view.newItemText.value, view.newItemCategory.value, Number(view.newItemAmount.value));
            });
        },

        /**
         * Create a new item and add it both in model and view,
         * adding events to it as well.
         *
         * @param {string} text - the item text that was entered
         * @param {string} category - the item category that was entered
         * @param {string} amount - the item amount that was entered
         */
        addNewItem: function (text, category, amount) {
            const item = model.addItem(text, category, amount);
            const itemElem = view.renderItem(item);
            view.setItemEvents(itemElem, controller.btnCallbacks, controller.dragendCallback);
        },

        // Functions that are called when click events fire on item buttons,
        // e.g. when clicking button to make an item red.
        // 'this' has to refer to the item element (not the button).
        btnCallbacks: {
            del: function () {
                const category = model.list.items[this.id].category;
                model.removeItem(this.id);
                view.removeElem(this.id);
                if (model.countCategorysItems(category) === 0)
                    view.removeElem(category);
            },
            green: function () {
                model.setItemState(this.id, STATES.green);
                view.setItemState(this, 'green');
            },
            yellow: function () {
                model.setItemState(this.id, STATES.yellow);
                view.setItemState(this, 'yellow');
            },
            red: function () {
                model.setItemState(this.id, STATES.red);
                view.setItemState(this, 'red');
            },
            grey: function () {
                model.setItemState(this.id, STATES.grey);
                view.setItemState(this, 'grey');
            }
        },

        dragendCallback: function (e) {
            console.log('Parent node now', e.target.parentNode);
            // FIXME: This is clunky...:
            model.setItemCategory(e.target.id, e.target.parentNode.parentNode.id);
        },

        /**
         * Print a message on the messages (log) element on the page.
         *
         * @param {string} message - The message to print
         */
        log: function (message) {
            view.messages.textContent = message;
        }

    };

    return {
        m: model,
        v: view,
        c: controller,
        init: controller.init
    };
})();

window.addEventListener('DOMContentLoaded', shoplist.init);
