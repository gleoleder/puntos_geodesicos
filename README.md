# 🌿 Red Geodésica INRA - Bolivia

Sistema de visualización interactiva de 1164 puntos geodésicos del Instituto Nacional de Reforma Agraria (INRA) de Bolivia.

## 📁 Estructura del Proyecto

```
red-geodesica/
├── index.html          # HTML principal
├── styles.css          # Estilos CSS
├── script.js           # Lógica JavaScript
├── data.js             # Datos (1164 puntos)
├── update_data.py      # Script Python para actualizar datos
└── README.md           # Este archivo
```

## 🚀 Características

✅ **1164 puntos geodésicos** del INRA
✅ **40 proyectos** clasificados por color
✅ **Búsqueda y filtros** en tiempo real
✅ **Leyenda emergente** desde logo en el mapa
✅ **Pantalla completa** del mapa
✅ **Sidebars retráctiles** con deslizador
✅ **Ficha técnica** con detalles completos
✅ **3 mapas base**: CartoDB, OSM, Satélite
✅ **Responsive** (desktop, tablet, móvil)

## 📋 Uso Rápido

### 1. Ejecutar localmente

```bash
# Opción 1: Simple (sin servidor)
cd red-geodesica
open index.html

# Opción 2: Con servidor local (Python 3)
python3 -m http.server 8000
# Luego abre: http://localhost:8000
```

### 2. Interfaz

- **Izquierda**: Búsqueda y lista de puntos
- **Centro**: Mapa interactivo
- **Derecha**: Filtros e información del punto
- **🎨 (en mapa)**: Leyenda de proyectos
- **⛶ (en mapa)**: Pantalla completa

## 🐍 Actualizar Datos con Python

### Requisitos

```bash
pip install geopandas pandas
```

### Usar el script

```bash
# Analizar GeoPackage
python3 update_data.py analizar datos_inra.gpkg

# Procesar y generar data.js
python3 update_data.py procesar datos_inra.gpkg -o red-geodesica/data.js
```

### Ejemplo de uso

```python
from update_data import procesar_gpkg

# Procesar GPKG y generar data.js
procesar_gpkg('inra.gpkg', 'data.js')
```

## 📊 Datos Incluidos

| Métrica | Valor |
|---------|-------|
| Total puntos | 1164 |
| Proyectos | 40 |
| Con descripción | 454 (39%) |
| Cobertura | Bolivia completa |
| Altura mín-máx | ~200 - 5500 m |

## 🎨 Colores de Proyectos

| Proyecto | Color |
|----------|-------|
| SET-MIN | 🟠 #ff6b35 |
| SAN-SIM | 🟣 #7c3aed |
| CAT-SAN | 🔵 #00d4ff |
| RED IGM | 🟡 #f0b429 |
| Y 36 más... | - |

## 🔍 Búsqueda y Filtros

### Buscar
- Por nombre del punto
- Por nombre del proyecto
- Por ubicación

### Filtrar
- Marca/desmarca proyectos
- Combinable con búsqueda
- Resultados actualizados en tiempo real

## 📱 Interfaz

### Sidebar Izquierdo (Búsqueda)
- Header con gradiente verde
- Estadísticas (Puntos totales y visibles)
- Buscador en tiempo real
- Lista de puntos (con scroll)
- Footer con créditos del autor

### Mapa Central
- **Botón ⛶**: Vista a pantalla completa
- **Botón 🎨**: Leyenda de proyectos (emergente)
- **Click en punto**: Abre popup con info
- **Zoom**: Rueda del ratón o botones
- **Arrastrar**: Navegar por el mapa

### Sidebar Derecho (Filtros e Info)
- **Leyenda de Proyectos** (no usado, está en mapa)
- **Filtros por Proyecto** con contadores
- **Ficha Técnica** del punto seleccionado:
  - ID, Nombre, Proyecto
  - Ubicación, Coordenadas
  - Altura elipsoidal
  - Descripción completa (con scroll)

## 🎯 Funcionalidades Principales

### Pantalla Completa
- Click en **⛶** en el mapa
- Oculta sidebars automáticamente
- Más espacio para el mapa
- Click nuevamente para salir

### Leyenda Emergente
- Click en **🎨** (logo en mapa)
- Muestra todos los proyectos
- Código de color y conteo
- Se cierra al hacer click afuera

### Seleccionar Punto
- Click en punto del mapa → Popup con info básica
- Click en lista (sidebar izquierdo) → Ficha completa en derecha
- Los sidebars se pueden ocultar para más espacio

## 🌐 Despliegue en GitHub

### 1. Crear repositorio

```bash
git init
git add .
git commit -m "Initial commit: Red Geodésica INRA"
git branch -M main
git remote add origin https://github.com/user/red-geodesica.git
git push -u origin main
```

### 2. Habilitar GitHub Pages

En tu repositorio:
1. Settings → Pages
2. Source: main branch
3. Save

Tu sitio estará en: `https://user.github.io/red-geodesica/`

## 📦 Incluidos

### Librerías
- **Leaflet.js** 1.9.4 - Mapas interactivos
- **Leaflet MarkerCluster** - Clustering de puntos
- **CartoDB** - Mapas base
- **OpenStreetMap** - Datos de mapas

### Tecnologías
- HTML5
- CSS3 (Grid, Flexbox, Animations)
- JavaScript ES6+
- Python (GeoPandas para procesamiento)

## 👤 Información del Proyecto

**Elaborado por:** John Leonardo Cabrera Espíndola  
**Email:** leoleder1@gmail.com  
**Fuente:** GeoPackage del INRA Bolivia  
**Licencia:** Open Database License (ODbL)

## 📞 Soporte

### Problemas comunes

**"No veo el mapa"**
- Espera 2-3 segundos a que cargue Leaflet
- Abre la consola (F12) para ver errores
- Recarga la página

**"El mapa es muy lento"**
- Normal con 1164 puntos
- Usa zoom más pequeño
- Reduce la lista con búsqueda

**"¿Cómo actualizar datos?"**
- Usa `update_data.py` con nuevo GeoPackage
- Reemplaza `data.js` en el proyecto
- Recarga la página

## 🚀 Próximas Mejoras

- [ ] Exportar datos (CSV/GeoJSON)
- [ ] Heatmap de densidad
- [ ] Tabla de datos interactiva
- [ ] Análisis estadístico
- [ ] Modo offline

## 📄 Licencia

Los datos del INRA se distribuyen bajo **Open Database License (ODbL)**.

---

**¡Disfruta tu aplicación! 🌿**
