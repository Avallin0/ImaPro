# ImaPro

Prototipo de aplicación web SaaS para analizar miniaturas de YouTube y detectar oportunidades de mejora mediante CTR, impresiones, retención y watch time.

---

# 🚀 Clonar el proyecto

```bash
git clone https://github.com/Avallin0/ImaPro.git
cd ImaPro
```

---

# 🛠 Configuración inicial

## 1. Crear un entorno virtual (recomendado)

### Windows

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Si `python` no funciona:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
```

---

## 2. Instalar dependencias

```powershell
pip install -r requirements.txt
```

---

## 3. Configurar Google OAuth

Por motivos de seguridad, **NO** se incluyen en el repositorio:

- `Datos/Backend/client_secret.json`
- `Datos/Backend/token.json`

Cada desarrollador debe crear sus propias credenciales en Google Cloud y colocarlas dentro de:

```text
Datos/
└── Backend/
    ├── client_secret.json
    └── token.json
```

---

## 4. Ejecutar la aplicación

Desde la raíz del proyecto:

```powershell
RUN.bat
```

o iniciar el servidor manualmente si se desea.

---

# Estructura del proyecto

```text
ImaPro/
│
├── Datos/
│   ├── Backend/
│   └── frontend/
│
├── RUN.bat
├── README.md
└── requirements.txt
```

---

# Estado del proyecto

Actualmente incluye:

- Landing pública.
- Sincronización de canal (prototipo).
- Dashboard post-sincronización.
- Detección de vídeos pendientes de revisar.
- Diagnóstico de vídeos.
- Preparación de A/B testing.
- Integración inicial con YouTube Data API.
- Arquitectura preparada para YouTube Analytics API.

---

# Objetivo

> **YouTube Studio proporciona los datos. ImaPro ayuda a decidir qué miniaturas revisar, por qué y con qué prioridad.**
