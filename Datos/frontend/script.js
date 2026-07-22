let videosOriginales = [];

const filtrosActivos = {
  privacidad: "todos",
  tipo: "todos",
  estado: "todos",
  busqueda: ""
};

const videosDemo = [
  {
    titulo: "Tarea PEvAU (QU2)",
    video_id: "HCVHBxdMPxo",
    fecha: "2023-03-21T12:31:27Z",
    views: 13,
    likes: 0,
    comentarios: 0,
    duracion: "12:24",
    privacidad: "unlisted",
    miniatura: "../Backend/miniaturas/HCVHBxdMPxo.jpg",
    estado: "Datos básicos importados",
    analizado: false
  },
  {
    titulo: "En feria 2019",
    video_id: "lsGAfGeUgvQ",
    fecha: "2019-06-19T18:54:29Z",
    views: 10,
    likes: 0,
    comentarios: 0,
    duracion: "0:35",
    privacidad: "private",
    miniatura: "../Backend/miniaturas/lsGAfGeUgvQ.jpg",
    estado: "Datos básicos importados",
    analizado: false
  },
  {
    titulo: "Miniatura ejemplo de vídeo público",
    video_id: "demo-publico-001",
    fecha: "2024-05-12T10:00:00Z",
    views: 2450,
    likes: 132,
    comentarios: 18,
    duracion: "8:42",
    privacidad: "public",
    miniatura: "",
    estado: "Pendiente de análisis",
    analizado: false ,
    impresiones: 180000,
    ctr: 2.1,
    watchTime: 18500,
    averageViewPercentage: 42,
  },
  {
    titulo: "Short de prueba para ImaPro",
    video_id: "demo-short-001",
    fecha: "2024-07-01T18:30:00Z",
    views: 8700,
    likes: 410,
    comentarios: 45,
    duracion: "0:42",
    privacidad: "public",
    miniatura: "",
    estado: "Analizado",
    analizado: true ,
    impresiones: 180000,
    ctr: 2.1,
    watchTime: 18500,
    averageViewPercentage: 42,
    
  },
  {
    titulo: "Directo guardado del canal",
    video_id: "demo-directo-001",
    fecha: "2024-09-20T21:00:00Z",
    views: 1200,
    likes: 65,
    comentarios: 9,
    duracion: "1:12:30",
    privacidad: "public",
    miniatura: "",
    estado: "Pendiente de análisis",
    analizado: false,
    tipo_manual: "directo"
  }
];

async function cargarVideos() {
  try {
    const respuesta = await fetch("../Backend/videos.json");

    if (!respuesta.ok) {
      throw new Error("No se pudo leer ../Backend/videos.json");
    }

    videosOriginales = await respuesta.json();

  } catch (error) {
    console.warn("No se pudo cargar videos.json. Usando datos demo para diseñar la interfaz.");
    videosOriginales = videosDemo;
  }

  const mediasCanal = calcularMediasCanal(videosOriginales);

  videosOriginales = videosOriginales.map((video) => {
    const videoNormalizado = {
      ...video,
      id: video.id || video.video_id,
      video_id: video.video_id || video.id,
      analizado: video.analizado ?? false,
      impresiones: Number(video.impresiones ?? video.impressions ?? 0),
      ctr: Number(video.ctr ?? video.clickThroughRate ?? 0),
      watchTime: Number(video.watchTime ?? video.watch_time ?? 0),
      averageViewPercentage: Number(video.averageViewPercentage ?? video.retencion ?? 0)
    };

    return {
      ...videoNormalizado,
      diagnosticoImaPro: diagnosticarVideo(videoNormalizado, mediasCanal)
    };
  });

  localStorage.setItem("imapro_videos", JSON.stringify(videosOriginales));

  actualizarVista();
  activarBuscador();
  activarFiltros();
}

function actualizarVista() {
  const videosFiltrados = aplicarFiltros(videosOriginales);

  actualizarResumen(videosOriginales);
  renderizarTopVideos(videosOriginales);
  renderizarVideos(videosFiltrados);

  renderizarVideosPendientes(videosOriginales);
  pintarDetalleVideo();
  pintarAbTesting();
  gestionarLoading();
}

function aplicarFiltros(videos) {
  return videos.filter((video) => {
    const titulo = video.titulo || "";
    const privacidad = video.privacidad || "";
    const videoId = video.video_id || "";

    const textoBusqueda = `${titulo} ${privacidad} ${videoId}`.toLowerCase();

    const cumpleBusqueda = textoBusqueda.includes(filtrosActivos.busqueda);

    const cumplePrivacidad =
      filtrosActivos.privacidad === "todos" ||
      privacidad === filtrosActivos.privacidad;

    const tipoVideo = obtenerTipoVideo(video);

    const cumpleTipo =
      filtrosActivos.tipo === "todos" ||
      tipoVideo === filtrosActivos.tipo;

    const estadoVideo = video.analizado ? "analizado" : "pendiente";

    const cumpleEstado =
      filtrosActivos.estado === "todos" ||
      estadoVideo === filtrosActivos.estado;

    return cumpleBusqueda && cumplePrivacidad && cumpleTipo && cumpleEstado;
  });
}

function renderizarVideos(videos) {
  const contenedor = document.querySelector("#videosContainer");

  if (!contenedor) return;

  contenedor.innerHTML = "";

  if (!videos.length) {
    contenedor.innerHTML = `
      <p class="empty-message">
        No se han encontrado vídeos con estos filtros.
      </p>
    `;
    return;
  }

  videos.forEach((video) => {
    const card = document.createElement("section");
    card.classList.add("video-card");

    const titulo = video.titulo || "Sin título";
    const fecha = formatearFecha(video.fecha);
    const duracion = formatearDuracion(video.duracion);
    const tipo = traducirTipo(obtenerTipoVideo(video));
    const privacidad = traducirPrivacidad(video.privacidad);
    const imagen = obtenerRutaImagen(video);
    const views = video.views ?? 0;
    const likes = video.likes ?? 0;
    const comentarios = video.comentarios ?? 0;
    const estadoAnalisis = video.analizado ? "Analizado" : "Pendiente de análisis";

    card.innerHTML = `
      <div class="thumbnail-box">
        <div class="thumbnail-title">Miniatura</div>
        ${
          imagen
            ? `<img src="${imagen}" alt="Miniatura de ${escaparHTML(titulo)}" class="thumbnail-image">`
            : `<div class="thumbnail-placeholder"></div>`
        }
      </div>

      <div class="video-info">
        <div class="video-title">${escaparHTML(acortarTitulo(titulo))}</div>

        <div class="video-meta">
          ${fecha} · ${duracion} · ${tipo} · ${privacidad}
        </div>

        <div class="video-stats">
          Views: ${views} · Likes: ${likes} · Comentarios: ${comentarios}
        </div>

        <div class="video-status">
          Estado ImaPro: ${estadoAnalisis}
        </div>

        <a href="loading.html?id=${video.video_id || ""}" class="analysis-button" data-video-id="${video.video_id || ""}">
  [Ver análisis]
</a>
    `;

    contenedor.appendChild(card);
  });
}

function renderizarTopVideos(videos) {
  const contenedor = document.querySelector("#topVideosContainer");

  if (!contenedor) return;

  const topVideos = [...videos]
    .sort((a, b) => Number(b.views || 0) - Number(a.views || 0))
    .slice(0, 3);

  contenedor.innerHTML = "";

  if (!topVideos.length) {
    contenedor.innerHTML = `
      <p class="empty-message">
        No hay vídeos suficientes para calcular el Top 3.
      </p>
    `;
    return;
  }

  topVideos.forEach((video, index) => {
    const card = document.createElement("article");
    card.classList.add("top-video-card");

    const titulo = video.titulo || "Sin título";
    const imagen = obtenerRutaImagen(video);

    card.innerHTML = `
      <div class="top-video-rank">#${index + 1}</div>

      ${
        imagen
          ? `<img src="${imagen}" alt="Miniatura de ${escaparHTML(titulo)}" class="top-video-image">`
          : `<div class="top-video-image"></div>`
      }

      <h3 class="top-video-title">${escaparHTML(acortarTitulo(titulo))}</h3>

      <p class="top-video-meta">
        ${video.views ?? 0} views · ${traducirTipo(obtenerTipoVideo(video))}
      </p>
    `;

    contenedor.appendChild(card);
  });
}

function actualizarResumen(videos) {
  const totalVideos = videos.length;

  const totalViews = videos.reduce((suma, video) => {
    return suma + Number(video.views || 0);
  }, 0);

  const totalPendientes = videos.filter((video) => !video.analizado).length;

  const totalVideosElemento = document.querySelector("#totalVideos");
  const totalViewsElemento = document.querySelector("#totalViews");
  const totalPendientesElemento = document.querySelector("#totalPendientes");

  if (totalVideosElemento) {
    totalVideosElemento.textContent = totalVideos;
  }

  if (totalViewsElemento) {
    totalViewsElemento.textContent = totalViews.toLocaleString("es-ES");
  }

  if (totalPendientesElemento) {
    totalPendientesElemento.textContent = totalPendientes;
  }
}

function activarBuscador() {
  const buscador = document.querySelector("#buscadorVideos");

  if (!buscador) return;

  buscador.addEventListener("input", () => {
    filtrosActivos.busqueda = buscador.value.toLowerCase().trim();
    actualizarVista();
  });
}

function activarFiltros() {
  const botones = document.querySelectorAll(".filter-btn");

  botones.forEach((boton) => {
    boton.addEventListener("click", () => {
      const grupo = boton.dataset.filterGroup;
      const valor = boton.dataset.filterValue;

      filtrosActivos[grupo] = valor;

      document
        .querySelectorAll(`.filter-btn[data-filter-group="${grupo}"]`)
        .forEach((btn) => btn.classList.remove("active"));

      boton.classList.add("active");

      actualizarVista();
    });
  });
}

function obtenerRutaImagen(video) {
  const ruta = video.archivo || video.miniatura || "";

  if (!ruta) return "";

  if (ruta.startsWith("http://") || ruta.startsWith("https://")) {
    return ruta;
  }

  if (ruta.startsWith("../")) {
    return ruta;
  }

  if (ruta.startsWith("miniaturas/")) {
    return `../Backend/${ruta}`;
  }

  if (ruta.startsWith("Backend/")) {
    return `../${ruta}`;
  }

  return `../Backend/${ruta}`;
}

function obtenerTipoVideo(video) {
  if (video.tipo_manual) {
    return video.tipo_manual;
  }

  const duracion = video.duracion;

  if (!duracion) return "video_largo";

  if (duracion.startsWith("PT")) {
    const patron = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const coincidencia = duracion.match(patron);

    if (!coincidencia) return "video_largo";

    const horas = Number(coincidencia[1] || 0);
    const minutos = Number(coincidencia[2] || 0);
    const segundos = Number(coincidencia[3] || 0);
    const totalSegundos = horas * 3600 + minutos * 60 + segundos;

    return totalSegundos <= 60 ? "short" : "video_largo";
  }

  const partes = duracion.split(":").map(Number);

  if (partes.length === 2) {
    const minutos = partes[0] || 0;
    const segundos = partes[1] || 0;
    const totalSegundos = minutos * 60 + segundos;

    return totalSegundos <= 60 ? "short" : "video_largo";
  }

  if (partes.length === 3) {
    return "video_largo";
  }

  return "video_largo";
}

function traducirTipo(tipo) {
  const mapa = {
    short: "Short",
    video_largo: "Vídeo largo",
    directo: "Directo"
  };

  return mapa[tipo] || "Vídeo";
}

function traducirPrivacidad(privacidad) {
  const mapa = {
    private: "Privado",
    public: "Público",
    unlisted: "No listado"
  };

  return mapa[privacidad] || privacidad || "Desconocido";
}

function formatearFecha(fechaISO) {
  if (!fechaISO) return "Fecha desconocida";

  return new Date(fechaISO).toLocaleDateString("es-ES");
}

function formatearDuracion(duracion) {
  if (!duracion) return "0:00";

  if (!duracion.startsWith("PT")) {
    return duracion;
  }

  const patron = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const coincidencia = duracion.match(patron);

  if (!coincidencia) return duracion;

  const horas = Number(coincidencia[1] || 0);
  const minutos = Number(coincidencia[2] || 0);
  const segundos = Number(coincidencia[3] || 0);

  if (horas > 0) {
    return `${horas}:${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
  }

  return `${minutos}:${String(segundos).padStart(2, "0")}`;
}

function acortarTitulo(titulo) {
  return titulo.length > 44 ? `${titulo.slice(0, 41)}...` : titulo;
}

function escaparHTML(texto) {
  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

cargarVideos();

/* =========================================================
   ImaPro - Diagnóstico, pendientes, detalle y A/B testing
========================================================= */

function calcularMediasCanal(videos) {
  const videosConCtr = videos.filter((video) => {
    return video.ctr !== undefined && video.ctr !== null && Number(video.ctr) > 0;
  });

  const videosConRetencion = videos.filter((video) => {
    return (
      video.averageViewPercentage !== undefined &&
      video.averageViewPercentage !== null &&
      Number(video.averageViewPercentage) > 0
    );
  });

  const mediaCtr = videosConCtr.length
    ? videosConCtr.reduce((suma, video) => suma + Number(video.ctr), 0) / videosConCtr.length
    : 4;

  const mediaRetencion = videosConRetencion.length
    ? videosConRetencion.reduce((suma, video) => suma + Number(video.averageViewPercentage), 0) / videosConRetencion.length
    : 35;

  return {
    ctr: mediaCtr,
    retencion: mediaRetencion
  };
}

function diagnosticarVideo(video, mediasCanal) {
  const ctr = Number(video.ctr || 0);
  const impresiones = Number(video.impresiones || 0);
  const retencion = Number(video.averageViewPercentage || 0);

  const mediaCtr = mediasCanal.ctr || 4;
  const mediaRetencion = mediasCanal.retencion || 35;

  if (impresiones >= 10000 && ctr < mediaCtr * 0.75 && retencion >= mediaRetencion * 0.9) {
    return {
      tipo: "miniatura_titulo",
      prioridad: "alta",
      titulo: "Posible problema de miniatura/título",
      explicacion:
        "El vídeo tiene muchas impresiones, pero convierte peor que la media del canal. La retención es aceptable, así que el contenido no parece ser el problema principal.",
      accion: "Preparar A/B test"
    };
  }

  if (ctr >= mediaCtr && retencion > 0 && retencion < mediaRetencion * 0.75) {
    return {
      tipo: "promesa_incumplida",
      prioridad: "media",
      titulo: "El packaging atrae, pero el vídeo no cumple",
      explicacion:
        "La miniatura y el título consiguen clics, pero los espectadores abandonan pronto. Puede haber una promesa incumplida, una intro débil o un desajuste entre expectativa y contenido.",
      accion: "Revisar promesa e intro"
    };
  }

  if (impresiones < 5000 && ctr >= mediaCtr * 0.8) {
    return {
      tipo: "tema_distribucion",
      prioridad: "baja",
      titulo: "Problema probable de tema o distribución",
      explicacion:
        "El CTR no parece malo, pero YouTube no ha mostrado mucho el vídeo. Puede ser un tema pequeño, mal timing o falta de señales suficientes.",
      accion: "No tocar miniatura todavía"
    };
  }

  if (impresiones < 5000 && ctr < mediaCtr * 0.75) {
    return {
      tipo: "datos_insuficientes",
      prioridad: "baja",
      titulo: "Datos insuficientes",
      explicacion:
        "Hay pocas impresiones y bajo CTR, pero todavía no hay señal suficiente para culpar a la miniatura.",
      accion: "Esperar más datos"
    };
  }

  if (ctr < mediaCtr * 0.75 && retencion > 0 && retencion < mediaRetencion * 0.75) {
    return {
      tipo: "concepto_completo",
      prioridad: "media",
      titulo: "Revisar concepto completo",
      explicacion:
        "El vídeo convierte poco y además retiene por debajo de la media. El problema puede estar en miniatura, título, tema e intro.",
      accion: "Revisar idea completa"
    };
  }

  return {
    tipo: "normal",
    prioridad: "baja",
    titulo: "Rendimiento normal",
    explicacion:
      "No hay una señal clara de fallo en miniatura, título o contenido.",
    accion: "Sin acción urgente"
  };
}

function renderizarVideosPendientes(videos) {
  const contenedor = document.querySelector("#pendientesContainer");

  if (!contenedor) return;

  const videosOrdenados = [...videos].sort((a, b) => {
    const orden = {
      alta: 3,
      media: 2,
      baja: 1
    };

    return (
      orden[b.diagnosticoImaPro?.prioridad || "baja"] -
      orden[a.diagnosticoImaPro?.prioridad || "baja"]
    );
  });

  if (!videosOrdenados.length) {
    contenedor.innerHTML = `
      <p class="empty-message">
        No hay vídeos suficientes para mostrar oportunidades de revisión.
      </p>
    `;
    return;
  }

  contenedor.innerHTML = videosOrdenados
    .map((video) => {
      const diagnostico = video.diagnosticoImaPro;
      const titulo = video.titulo || video.title || "Vídeo sin título";
      const imagen = obtenerRutaImagen(video);
      const videoId = video.video_id || video.id || "";

      return `
        <article class="video-diagnosis-card">
          ${
            imagen
              ? `<img src="${imagen}" alt="Miniatura de ${escaparHTML(titulo)}">`
              : `<div class="thumbnail-placeholder"></div>`
          }

          <div class="video-diagnosis-content">
            <span class="priority-badge ${diagnostico.prioridad}">
              ${diagnostico.prioridad.toUpperCase()} prioridad
            </span>

            <h2>${escaparHTML(titulo)}</h2>

            <p class="diagnosis-text">
              <strong>${escaparHTML(diagnostico.titulo)}.</strong>
              ${escaparHTML(diagnostico.explicacion)}
            </p>

            <div class="metrics-row">
              <span>Impresiones: ${formatearNumero(video.impresiones || 0)}</span>
              <span>CTR: ${video.ctr || 0}%</span>
              <span>Retención: ${video.averageViewPercentage || 0}%</span>
              <span>Views: ${formatearNumero(video.views || 0)}</span>
            </div>

            <div class="actions-row">
              <a href="detalle.html?id=${videoId}" class="secondary-button">
                Ver diagnóstico
              </a>

              <a href="ab-testing.html?id=${videoId}" class="primary-button">
                Preparar A/B test
              </a>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function pintarDetalleVideo() {
  const tituloDetalle = document.querySelector("#detalleTitulo");

  if (!tituloDetalle) return;

  const id = obtenerParametroId();
  const videos = obtenerVideosGuardados();
  const video = videos.find((v) => String(v.video_id || v.id) === String(id));

  if (!video) {
    tituloDetalle.textContent = "Vídeo no encontrado";
    return;
  }

  const diagnostico = video.diagnosticoImaPro;
  const imagen = obtenerRutaImagen(video);
  const titulo = video.titulo || video.title || "Vídeo sin título";

  const miniatura = document.querySelector("#detalleMiniatura");
  const views = document.querySelector("#detalleViews");
  const impresiones = document.querySelector("#detalleImpresiones");
  const ctr = document.querySelector("#detalleCtr");
  const retencion = document.querySelector("#detalleRetencion");
  const diagnosticoTitulo = document.querySelector("#detalleDiagnostico");
  const explicacion = document.querySelector("#detalleExplicacion");
  const botonAbTesting = document.querySelector("#detalleAbTesting");

  if (miniatura && imagen) miniatura.src = imagen;
  if (tituloDetalle) tituloDetalle.textContent = titulo;
  if (views) views.textContent = `Views: ${formatearNumero(video.views || 0)}`;
  if (impresiones) impresiones.textContent = `Impresiones: ${formatearNumero(video.impresiones || 0)}`;
  if (ctr) ctr.textContent = `CTR: ${video.ctr || 0}%`;
  if (retencion) retencion.textContent = `Retención: ${video.averageViewPercentage || 0}%`;
  if (diagnosticoTitulo) diagnosticoTitulo.textContent = diagnostico.titulo;
  if (explicacion) explicacion.textContent = diagnostico.explicacion;

  if (botonAbTesting) {
    botonAbTesting.href = `ab-testing.html?id=${video.video_id || video.id}`;
  }

  const videoIdText = document.querySelector("#video-id-text");

  if (videoIdText) {
    videoIdText.textContent = `ID del vídeo: ${video.video_id || video.id}`;
  }
}

function pintarAbTesting() {
  const miniaturaActual = document.querySelector("#abMiniaturaActual");

  if (!miniaturaActual) return;

  const id = obtenerParametroId();
  const videos = obtenerVideosGuardados();
  const video = videos.find((v) => String(v.video_id || v.id) === String(id));

  if (!video) return;

  const imagen = obtenerRutaImagen(video);
  const titulo = video.titulo || video.title || "Vídeo sin título";
  const diagnostico = video.diagnosticoImaPro;

  if (imagen) {
    miniaturaActual.src = imagen;
  }

  const tituloActual = document.querySelector("#abTituloActual");

  if (tituloActual) {
    tituloActual.textContent = titulo;
  }

  const hipotesis = document.querySelector("#abHipotesis");

  if (!hipotesis) return;

  if (diagnostico.tipo === "miniatura_titulo") {
    hipotesis.textContent =
      "Este vídeo tiene muchas impresiones, CTR bajo y retención aceptable. Es buen candidato para probar una miniatura o título más claros.";
  } else if (diagnostico.tipo === "promesa_incumplida") {
    hipotesis.textContent =
      "El vídeo consigue clics, pero retiene poco. Antes de cambiar la miniatura, revisa si la promesa del título y la intro están alineadas.";
  } else if (diagnostico.tipo === "tema_distribucion") {
    hipotesis.textContent =
      "Este vídeo no parece fallar principalmente por miniatura. El CTR es aceptable, pero tiene pocas impresiones. Puede ser un problema de tema o distribución.";
  } else {
    hipotesis.textContent =
      "Este vídeo no muestra una señal clara de que el problema principal sea la miniatura. Conviene revisar más datos antes de testear.";
  }
}

function gestionarLoading() {
  const detailButton = document.querySelector("#go-detail-btn");

  if (!detailButton) return;

  const id = obtenerParametroId();

  if (id) {
    detailButton.href = `detalle.html?id=${id}`;
  } else {
    detailButton.href = "detalle.html";
  }

  setTimeout(() => {
    if (id) {
      window.location.href = `detalle.html?id=${id}`;
    } else {
      window.location.href = "detalle.html";
    }
  }, 3500);
}

function obtenerParametroId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function obtenerVideosGuardados() {
  return JSON.parse(localStorage.getItem("imapro_videos") || "[]");
}

function formatearNumero(numero) {
  return new Intl.NumberFormat("es-ES").format(Number(numero || 0));
}