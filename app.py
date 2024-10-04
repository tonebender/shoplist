#!/usr/bin/python3
# -*- coding: utf-8 -*-

from flask import Flask, render_template, request
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config.update(SAVEDIR='shoplists')


@app.route('/')
def indexpage():
    return render_template('index.html')


@app.route('/save/<name>', methods=['POST'])
def save_shoplist(name):
    content = request.get_json()
    return 'You entered ' + secure_filename(name) + '.json, and posted ' + str(content)


if __name__ == '__main__':
    app.run()
