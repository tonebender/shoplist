#!/usr/bin/python3
# -*- coding: utf-8 -*-

from flask import Flask, render_template, request
from werkzeug.utils import secure_filename
import json

app = Flask(__name__)
app.config.update(SAVEDIR='lists/')


@app.route('/')
def indexpage():
    return render_template('index.html')


@app.route('/load/<name>', methods=['GET'])
def load_shoplist(name):
    filename = app.config['SAVEDIR'] + secure_filename(name) + '.json'
    try:
        with open(filename, mode='r', encoding='utf-8') as f:
            content = f.read()
    except OSError as e:
        return json.loads(f'{{"error": "{e}"}}')
    return json.loads(content)


@app.route('/save/<name>', methods=['POST'])
def save_shoplist(name):
    content = request.get_json()
    filename = app.config['SAVEDIR'] + secure_filename(name) + '.json'
    try:
        with open(filename, mode='w', encoding='utf-8') as f:
            f.write(json.dumps(content))
    except OSError as e:
        return json.loads(f'{{"error": "{e}"}}')
    return 'Wrote json to file.'


if __name__ == '__main__':
    app.run()
