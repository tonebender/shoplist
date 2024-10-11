/* jshint esversion: 6 */

const shoplist = (function () {

    const GREY = 0,
        BLACK = 1,
        GREEN = 2,
        YELLOW = 3,
        RED = 4;

    class Item {
        constructor(id, text = '', category = 'ovrigt', amount = 1, state = BLACK) {
            this.id = id;
            this.text = text;
            this.category = category;
            this.amount = amount;
            this.state = state;
        }
    }

    const model = {

        // The working copy of the shopping list
        list: {},

        // The shopping list loaded from the server
        listFromServer: {},

        listname: '',

        lastId: 1,

        addItem: function (text, category, amount) {
            model.list.items.push(new Item(++(model.lastId), text, category, amount));
            return model.list.items.slice(-1)[0];
        },

        replaceItem: function (id, newItem) {
            model.list.items = model.list.items.map(item =>
                item.id === id ? newItem : item
            );
        },

        removeItem: function (id) {
            model.list.items = model.list.items.filter(item => item.id != id);
        },

        removeAll: function () {
            model.list.items = [];
        },

        setItemState: function (id, state) {
            model.list.items = model.list.items.map(item =>
                item.id === id ? new Item(id = item.id, state = state) : item
            );
        },

        updateListTime: function () {
            model.list.time = new Date().toLocaleString('sv-SE');
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
        },

        /**
         * Run callback if model.list is newer than the list of same name saved on the server.
         */
        doIfNewer: function (callback) {
            model.loadFromServer(function (serverList) {
                const d1 = new Date(model.list.time);
                const d2 = new Date(serverList.time);
                if (d1.getTime() > d2.getTime()) {
                    callback();
                }
            });
        }
    },

    view = {

        /**
         * Load all the needed DOM elements into variables. Should be run at start.
         */
        getDOMElements: function () {
            const elements = [
                'shoplist',
                'listname',
                'messages',
                'btnNewItem',
                'dialogNewItem',
                'newItemText',
                'newItemAmount',
                'btnNewItemAdd'
            ];
            elements.map(elemID => {
                view[elemID] = document.querySelector('#' + elemID);
            });
            /*
            view.sl = document.querySelector('#shoplist');
            view.listname = document.querySelector('#listname');
            view.messages = document.querySelector('#messages');
            view.btnNewItem = document.querySelector('#btnNewItem');
            view.dialogNewItem = document.querySelector('#dialogNewItem');
            view.btnNewItemAdd = document.querySelector('#btnNewItemAdd');
            */
        },

        setAttrs: function (el, attrs) {
            Object.keys(attrs)
                .filter(key => el[key] !== undefined)
                .forEach(key =>
                    typeof attrs[key] === 'object' ? Object.keys(attrs[key])
                    .forEach(innerKey => el[key][innerKey] = attrs[key][innerKey])
                    : el[key] = attrs[key]
                );
        },

        createCategory: function (categoryKey) {
            const catLi = document.createElement('li');
            catLi.setAttribute('id', 'category_' + categoryKey);
            catLi.textContent = model.list.categories[categoryKey];
            const catUl = document.createElement('ul');
            catLi.append(catUl);
            return catLi;
        },

        /**
         * Create a shopping list element.
         *
         * @param {string} id - the element's id attribute
         * @param {string} value - the element's value attribute
         * @param {string} amountValue - the value of the amount input box
         * @returns {object} the HTML element
         */
        // TODO: Maybe change func params to a single item object param?
        createItem: function (id, value, amountValue) {
            id = 'item_' + id;
            const item = document.createElement('li'),
                text = document.createElement('input'),
                amount = document.createElement('input'),
                btnItemDel = document.createElement('button');
            item.setAttribute('id', id);
            view.setAttrs(text, {type: 'text', id: id + '_text', name: id + '_text', value: value});
            view.setAttrs(amount, {type: 'text', id: id + '_amount', name: id + '_amount', value: amountValue});
            view.setAttrs(btnItemDel, {type: 'button', id: id + '_del'});
            btnItemDel.textContent = 'X';
            item.append(btnItemDel);
            item.append(text);
            item.append(amount);
            return item;
        },

        /**
         * Show the shopping list on the page.
         */
        renderList: function () {
            model.list.items.map(item => view.renderItem(item));
        },

        /**
         * Show an item in the list on the page, putting it in its proper
         * category, rendering the category element if it didn't already exist.
         *
         * @param {object} i - the item object (from model.list.items) to render
         */
        renderItem: function (i) {
            const item = view.createItem(i.id, i.text, i.amount);
            let categoryElem = document.querySelector('#category_' + i.category);
            if (!categoryElem) {
                categoryElem = view.createCategory(i.category);
                view.shoplist.append(categoryElem);
            }
            categoryUl = categoryElem.querySelector('ul');
            categoryUl.append(item);
            return item;
        },

        /**
         * Remove the item element from the list.
         *
         * @param {string} id - the ID of the item to remove
         */
        removeItem: function (id) {
            const item = document.querySelector('#item_' + id);
            item.remove();
            // TODO: Check if category is now empty and remove it if so
        },

        /**
         * Show the dialog to add a new shoplist item.
         */
        showNewItemDialog: function () {
            view.dialogNewItem.classList.add('shown');
        }

    },

    controller = {

        /**
         * Initialize this JS app: set DOM element variables, load a shoplist, etc.
         * This should be run when the DOM is ready after page load.
         */
        init: function () {
            view.getDOMElements();
            controller.setEvents();
            model.listname = view.listname.value;
            if (model.listname) model.loadFromServer(function (payload) {
                model.listFromServer = payload;
                model.list = structuredClone(model.listFromServer);
                view.renderList();
            });
        },

        setEvents: function () {
            view.btnNewItem.addEventListener('click', view.showNewItemDialog);
            view.btnNewItemAdd.addEventListener('click', controller.addNewItem);
        },

        addNewItem: function () {
            const i = model.addItem(view.newItemText.value, undefined, Number(view.newItemAmount.value));
            const iElem = view.renderItem(i);
            const btnDel = iElem.querySelector('#item_' + i.id + '_del');
            btnDel.addEventListener('click', () => {
                model.removeItem(i.id);
                view.removeItem(i.id);
            });
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
