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

        list: {
            date: new Date().toLocaleString('sv-SE'),
            items: [
                new Item(0, 'Mjölk', 'mejeri'),
                new Item(1, 'Gurka', 'gronsaker')
            ],
            categories: {
                brod: 'Bröd',
                frukt: 'Frukt',
                frys: 'Frys',
                gronsaker: 'Grönsaker',
                husgerad: 'Husgeråd',
                hygien: 'Hygien',
                kottfisk: 'Kött och fisk',
                mejeri: 'Mejeri',
                ovrigt: 'Övrigt',
                snacks: 'Snacks och godis',
                torrvaror: 'Torrvaror',
            }
        },

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

        loadList: function () {
            const xhr = new XMLHttpRequest();
            xhr.addEventListener('load', function () {
                console.log(this.responseText);
            });
            xhr.open('POST', '/load/test.json');
            xhr.send();
        },

        saveList: function () {
            const xhr = new XMLHttpRequest();
            xhr.addEventListener('load', function () {
                console.log(this.responseText);
            });
            xhr.open('POST', '/save/test.json');
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify(model.list));
        }
    },

    view = {
        sl: document.querySelector('#shoplist'),

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
    };

    return {
        m: model,
        v: view
    };
})();
