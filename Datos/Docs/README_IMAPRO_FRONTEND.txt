IMAPRO v0.1 - Frontend post-sincronizacion

Archivos modificados:
- index.html: pantalla post-sincronizacion siguiendo el wireframe de Figma.
- stilo.css: diseño visual de la pantalla.
- script.js: carga videos.json y crea cards de miniaturas automaticamente.

Como probarlo:
1. Abre la carpeta en VS Code.
2. Usa Go Live / Live Server para abrir index.html.
3. No abras index.html directamente con doble clic si quieres que lea videos.json, porque fetch puede fallar por seguridad del navegador.

Notas:
- El frontend lee videos.json.
- Si existe video.archivo, usa la miniatura local de la carpeta miniaturas.
- Si no existe video.archivo, usa video.miniatura.
- El boton [Ver analisis] todavia no navega a otra pagina. Eso se conectara cuando creemos la pantalla de detalle.

Pendiente para siguientes pantallas:
- landing publica
- pantalla de carga/analisis
- pagina detalle del video
