from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

import requests
import os
import re

SCOPES = [
    "https://www.googleapis.com/auth/youtube.readonly"
]

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

CLIENT_SECRET = os.path.join(BASE_DIR, "client_secret.json")
TOKEN_FILE = os.path.join(BASE_DIR, "token.json")
MINIATURAS_DIR = os.path.join(BASE_DIR, "miniaturas")


def formatear_duracion_iso(duracion_iso):

    patron = r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?"
    coincidencia = re.match(patron, duracion_iso)

    if not coincidencia:
        return duracion_iso

    horas = int(coincidencia.group(1) or 0)
    minutos = int(coincidencia.group(2) or 0)
    segundos = int(coincidencia.group(3) or 0)

    if horas > 0:
        return f"{horas}:{minutos:02d}:{segundos:02d}"

    return f"{minutos}:{segundos:02d}"


def autenticar():

    creds = None

    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(
            TOKEN_FILE,
            SCOPES
        )

    if not creds or not creds.valid:

        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())

        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                CLIENT_SECRET,
                SCOPES
            )

            creds = flow.run_local_server(port=0)

        with open(TOKEN_FILE, "w") as token:
            token.write(creds.to_json())

    return build(
        "youtube",
        "v3",
        credentials=creds
    )


def obtener_videos():

    youtube = autenticar()

    os.makedirs(MINIATURAS_DIR, exist_ok=True)

    videos = []

    canal = youtube.channels().list(
        part="snippet,statistics,contentDetails",
        mine=True
    ).execute()

    datos = canal["items"][0]

    uploads_playlist = datos["contentDetails"]["relatedPlaylists"]["uploads"]

    next_page_token = None

    while True:

        respuesta = youtube.playlistItems().list(
            part="snippet",
            playlistId=uploads_playlist,
            maxResults=50,
            pageToken=next_page_token
        ).execute()

        for item in respuesta["items"]:

            video_id = item["snippet"]["resourceId"]["videoId"]

            info_video = youtube.videos().list(
                part="snippet,statistics,contentDetails,status",
                id=video_id
            ).execute()

            if not info_video["items"]:
                continue

            video = info_video["items"][0]

            titulo = video["snippet"]["title"]
            fecha = video["snippet"]["publishedAt"]

            miniatura_url = (
                video["snippet"]
                .get("thumbnails", {})
                .get("high", {})
                .get("url", "")
            )

            duracion = formatear_duracion_iso(
                video["contentDetails"]["duration"]
            )

            privacidad = video["status"]["privacyStatus"]

            vistas = int(
                video.get("statistics", {}).get("viewCount", 0)
            )

            likes = int(
                video.get("statistics", {}).get("likeCount", 0)
            )

            comentarios = int(
                video.get("statistics", {}).get("commentCount", 0)
            )

            ruta_local = os.path.join(
                MINIATURAS_DIR,
                f"{video_id}.jpg"
            )

            if miniatura_url and not os.path.exists(ruta_local):

                try:

                    respuesta_imagen = requests.get(
                        miniatura_url,
                        timeout=30
                    )

                    if respuesta_imagen.status_code == 200:

                        with open(ruta_local, "wb") as archivo:
                            archivo.write(
                                respuesta_imagen.content
                            )

                except Exception as e:
                    print(e)

            videos.append({

                "titulo": titulo,

                "video_id": video_id,

                "fecha": fecha,

                "views": vistas,

                "likes": likes,

                "comentarios": comentarios,

                "duracion": duracion,

                "privacidad": privacidad,

                "miniatura": f"miniaturas/{video_id}.jpg",

                "estado": "Datos básicos importados"

            })

        next_page_token = respuesta.get("nextPageToken")

        if not next_page_token:
            break

    return videos