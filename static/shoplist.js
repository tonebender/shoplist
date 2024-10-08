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

        list: {},

        listname: '',

        lastId: 1,

        addItem: function (text, category) {
            model.list.items.push(new Item(++lastId, text, category));
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
        loadList: function (callWhenDone) {
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

        saveList: function () {
            const xhr = new XMLHttpRequest();
            xhr.addEventListener('load', function () {
                if (xhr.status === 200) {
                    controller.log(this.responseText);
                }
            });
            xhr.open('POST', '/save/' + model.listname);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify(model.list));
        },

        /**
         * Run callback if model.list is newer than the list of same name saved on the server.
         */
        doIfNewer: function (callback) {
            model.loadList(function (serverList) {
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
            view.sl = document.querySelector('#shoplist');
            view.listname = document.querySelector('#listname');
            view.messages = document.querySelector('#messages');
        },

        setAttributes: function (el, attrs) {
            Object.keys(attrs)
                .filter(key => el[key] !== undefined)
                .forEach(key =>
                    typeof attrs[key] === 'object' ? Object.keys(attrs[key])
                    .forEach(innerKey => el[key][innerKey] = attrs[key][innerKey])
                    : el[key] = attrs[key]
                );
        },

        createCategoryElem: function (categoryKey) {
            const catLi = document.createElement('li');
            catLi.setAttribute('id', '#category_' + categoryKey);
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
        createItemElem: function (id, value, amountValue) {
            const item = document.createElement('li'),
                text = document.createElement('input'),
                amount = document.createElement('input');
            item.setAttribute('id', id);
            view.setAttributes(text, {type: 'text', id: id + '_text', name: id + '_text', value: value});
            view.setAttributes(amount, {type: 'text', id: id + '_amount', name: id + '_amount', value: amountValue});
            item.append(text);
            item.append(amount);
            return item;
        },

        /**
         * Show the shopping list on the page.
         */
        renderList: function () {
            let categoryElem;
            for (const i of model.list.items) {
                const item = view.createItemElem(i.id, i.text, i.amount);
                categoryElem = document.querySelector('#category_' + i.category);
                if (!categoryElem) {
                    categoryElem = view.createCategoryElem(i.category);
                    view.sl.append(categoryElem);
                }
                categoryUl = categoryElem.querySelector('ul');
                categoryUl.append(item);
            }
        }

    },

    controller = {

        /**
         * Initialize this JS app: set DOM element variables, load a shoplist, etc.
         * This should be run when the DOM is ready after page load.
         */
        init: function () {
            view.getDOMElements();
            model.listname = view.listname.value;
            if (model.listname) model.loadList(function (loaded) {
                model.list = loaded;
                view.renderList();
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
