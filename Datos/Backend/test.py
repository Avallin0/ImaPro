from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
import requests
import os
import json
import re

SCOPES = [
    "https://www.googleapis.com/auth/youtube.readonly"
]


def formatear_duracion_iso(duracion_iso):
    """
    Convierte duraciones de YouTube:
    PT35S -> 0:35
    PT12M24S -> 12:24
    PT1H02M10S -> 1:02:10
    """

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


# ==========================
# AUTENTICACION
# ==========================

creds = None

if os.path.exists("token.json"):
    creds = Credentials.from_authorized_user_file(
        "token.json",
        SCOPES
    )

if not creds or not creds.valid:

    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())

    else:
        flow = InstalledAppFlow.from_client_secrets_file(
            "client_secret.json",
            SCOPES
        )
        creds = flow.run_local_server(port=0)

    with open("token.json", "w") as token:
        token.write(creds.to_json())

youtube = build(
    "youtube",
    "v3",
    credentials=creds
)

# Crear carpeta de miniaturas si no existe
os.makedirs("miniaturas", exist_ok=True)

# Lista donde guardaremos los vídeos para videos.json
videos_para_json = []

# ==========================
# DATOS DEL CANAL
# ==========================

canal = youtube.channels().list(
    part="snippet,statistics,contentDetails",
    mine=True
).execute()

datos = canal["items"][0]

print("\n===== CANAL =====")
print("Nombre:", datos["snippet"]["title"])
print("ID:", datos["id"])
print("Suscriptores:", datos["statistics"].get("subscriberCount", "0"))
print("Videos:", datos["statistics"].get("videoCount", "0"))
print("Views:", datos["statistics"].get("viewCount", "0"))

uploads_playlist = datos["contentDetails"]["relatedPlaylists"]["uploads"]

print("\nPlaylist uploads:")
print(uploads_playlist)

# ==========================
# VIDEOS DEL CANAL
# ==========================

print("\n===== VIDEOS =====")

next_page_token = None
hay_videos = False

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

        hay_videos = True

        video = info_video["items"][0]

        titulo = video["snippet"]["title"]
        fecha = video["snippet"]["publishedAt"]

        miniatura_url = (
            video["snippet"]
            .get("thumbnails", {})
            .get("high", {})
            .get("url", "")
        )

        duracion_iso = video["contentDetails"]["duration"]
        duracion = formatear_duracion_iso(duracion_iso)

        privacidad = video["status"]["privacyStatus"]

        vistas = video.get("statistics", {}).get("viewCount", "0")
        likes = video.get("statistics", {}).get("likeCount", "0")
        comentarios = video.get("statistics", {}).get("commentCount", "0")

        ruta_imagen = os.path.join(
            "miniaturas",
            f"{video_id}.jpg"
        )

        # Descargar miniatura
        if miniatura_url:
            try:
                respuesta_imagen = requests.get(miniatura_url, timeout=30)

                if respuesta_imagen.status_code == 200:
                    with open(ruta_imagen, "wb") as archivo:
                        archivo.write(respuesta_imagen.content)

            except Exception as e:
                print(f"Error descargando miniatura: {e}")

        print("\n----------------------------------------")
        print("Título:", titulo)
        print("Video ID:", video_id)
        print("Fecha:", fecha)
        print("Views:", vistas)
        print("Likes:", likes)
        print("Comentarios:", comentarios)
        print("Duración:", duracion)
        print("Privacidad:", privacidad)
        print("Miniatura:", miniatura_url)
        print("Archivo:", ruta_imagen)

        # Guardar datos para el frontend
        videos_para_json.append({
            "titulo": titulo,
            "video_id": video_id,
            "fecha": fecha,
            "views": int(vistas),
            "likes": int(likes),
            "comentarios": int(comentarios),
            "duracion": duracion,
            "privacidad": privacidad,
            "miniatura": ruta_imagen.replace("\\", "/"),
            "estado": "Datos básicos importados"
        })

    next_page_token = respuesta.get("nextPageToken")

    if not next_page_token:
        break

# ==========================
# GUARDAR videos.json
# ==========================

with open("videos.json", "w", encoding="utf-8") as archivo_json:
    json.dump(
        videos_para_json,
        archivo_json,
        ensure_ascii=False,
        indent=4
    )

print("\n===== ARCHIVO JSON =====")
print(f"Se han guardado {len(videos_para_json)} vídeos en videos.json")

if not hay_videos:
    print("No hay videos subidos.")