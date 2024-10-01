/* jshint esversion: 6 */

const shoplist = (function () {

    const GREY = 0,
        BLACK = 1,
        GREEN = 2,
        YELLOW = 3,
        RED = 4;

    class Item {
        constructor(id, text = '', amount = 1, state = BLACK) {
            this.id = id;
            this.text = text;
            this.amount = amount;
            this.state = state;
        }
    }

    const model = {

        list: {
            date: new Date().toLocaleString('sv-SE'),
            cats: {
                mejeri: {
                    title: 'Mejeri',
                    items: [
                        new Item(0, 'Mjölk')
                    ]
                },
                gronsaker: {
                    title: 'Grönsaker',
                    items: []
                }
            }
        },

        lastId: 0,

        addItem: function (category, text) {
            model.list.cats[category].items.push(new Item(++lastId, text));
        },

        replaceItem: function (category, id, newItem) {
            model.list.cats[category].items = model.list.cats[category].items.map(item =>
                item.id === id ? newItem : item
            );
        },

        removeItem: function (category, id) {
            model.list.cats[category].items = model.list.cats[category].items.filter(item => item.id != id);
        },

        removeAll: function () {
            for (let key in model.list.cats) {
                model.list.cats[key].items = [];
            }
        },

        setItemState: function (category, id, state) {
            model.list.cats[category].items = model.list.cats[category].items.map(item =>
                item.id === id ? new Item(id = item.id, state = state) : item
            );
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

        createCategoryElem: function (category) {
            const cat = document.createElement('div');
            return cat;
        },

        createItemElem: function (id) {
            const item = document.createElement('div'),
                text = document.createElement('input'),
                amount = document.createElement('input');
            item.setAttribute('id', id);
            view.setAttributes(text, {type: 'text', id: 'text_' + id, name: 'text_' + id});
            view.setAttributes(amount, {type: 'text', id: 'amount_' + id, name: 'amount_' + id});
            item.append(text);
            item.append(amount);
            return item;
        },

        renderList: function () {
            for (let key in model.list.cats) {
                const cat = view.createCategoryElem(model.list.cats[key].title);
                for (const i of model.list.cats[key].items) {
                    const item = view.createItemElem(i.id);
                    cat.append(item);
                }
                view.sl.append(cat);
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
