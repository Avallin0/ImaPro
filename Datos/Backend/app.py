from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

import os

from youtube import obtener_videos

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MINIATURAS_DIR = os.path.join(BASE_DIR, "miniaturas")


@app.route("/")
def inicio():
    return {"nombre": "ImaPro API", "version": "0.1"}


@app.route("/videos")
def videos():
    return jsonify(obtener_videos())


@app.route("/miniaturas/<path:nombre>")
def miniatura(nombre):
    return send_from_directory(MINIATURAS_DIR, nombre)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
