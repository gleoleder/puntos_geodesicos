// ═══════════════════════════════════════════════════════════════
// RED GEODÉSICA INRA - SCRIPT PRINCIPAL
// ═══════════════════════════════════════════════════════════════

// Configuración
const INRA_DATA = window.DATA_INRA || [];
let map;
let markers = L.markerClusterGroup({ maxClusterRadius: 80, disableClusteringAtZoom: 16 });
let filteredData = INRA_DATA;
let selectedMarker = null;
let activeFilters = new Set();
let isFullscreen = false;

// ═══════════════════════════════════════════════════════════════
// INICIALIZACIÓN
// ═══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    initToggleButtons();
    initSaveState();
    initLegend();
    initializeFilters();
    loadPoints(INRA_DATA);
    setupSearch();
    console.log('✅ Red Geodésica INRA - Aplicación iniciada');
});

// ═══════════════════════════════════════════════════════════════
// MAPA
// ═══════════════════════════════════════════════════════════════

function initMap() {
    map = L.map('map').setView([-17.0, -65.0], 6);

    const cartodb = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
        crossOrigin: true
    });

    cartodb.addTo(map);

    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
        crossOrigin: true
    });

    const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Esri, DigitalGlobe',
        maxZoom: 18,
        crossOrigin: true
    });

    L.control.layers({'CartoDB': cartodb, 'OpenStreetMap': osm, 'Satélite': satellite}).addTo(map);
    map.addLayer(markers);
}

// ═══════════════════════════════════════════════════════════════
// GUARDAR ESTADO
// ═══════════════════════════════════════════════════════════════

function initSaveState() {
    const saveBtn = document.getElementById('save-state-btn');
    const sidebarLeft = document.getElementById('sidebar-left');
    const sidebarRight = document.getElementById('sidebar-right');

    // Restaurar estado guardado al cargar
    const savedState = localStorage.getItem('sidebarsState');
    if (savedState) {
        const state = JSON.parse(savedState);
        if (state.leftCollapsed) {
            sidebarLeft.classList.add('collapsed');
        }
        if (state.rightCollapsed) {
            sidebarRight.classList.add('collapsed');
        }
        updateSaveButton();
    }

    // Guardar estado al hacer click
    saveBtn.addEventListener('click', () => {
        const state = {
            leftCollapsed: sidebarLeft.classList.contains('collapsed'),
            rightCollapsed: sidebarRight.classList.contains('collapsed')
        };
        localStorage.setItem('sidebarsState', JSON.stringify(state));
        updateSaveButton();
        // Notificar al usuario
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '✓';
        setTimeout(() => {
            saveBtn.innerHTML = originalText;
        }, 1000);
    });

    function updateSaveButton() {
        const state = JSON.parse(localStorage.getItem('sidebarsState') || '{}');
        if (state.leftCollapsed || state.rightCollapsed) {
            saveBtn.style.opacity = '1';
            saveBtn.style.color = '#7ac66c';
        } else {
            saveBtn.style.opacity = '0.6';
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// TOGGLE BUTTONS
// ═══════════════════════════════════════════════════════════════

function initToggleButtons() {
    // Toggle sidebars
    document.getElementById('toggle-left').addEventListener('click', () => {
        const sidebar = document.getElementById('sidebar-left');
        sidebar.classList.toggle('collapsed');
        setTimeout(() => map.invalidateSize(), 350);
    });

    document.getElementById('toggle-right').addEventListener('click', () => {
        const sidebar = document.getElementById('sidebar-right');
        sidebar.classList.toggle('collapsed');
        setTimeout(() => map.invalidateSize(), 350);
    });

    // Fullscreen map
    document.getElementById('fullscreen-btn').addEventListener('click', () => {
        isFullscreen = !isFullscreen;
        const sidebar_left = document.getElementById('sidebar-left');
        const sidebar_right = document.getElementById('sidebar-right');
        const btn = document.getElementById('fullscreen-btn');

        if (isFullscreen) {
            sidebar_left.style.display = 'none';
            sidebar_right.style.display = 'none';
            btn.innerHTML = '⛶';
            btn.title = 'Salir de pantalla completa';
        } else {
            sidebar_left.style.display = 'flex';
            sidebar_right.style.display = 'flex';
            btn.innerHTML = '⛶';
            btn.title = 'Pantalla completa';
        }

        setTimeout(() => {
            map.invalidateSize();
        }, 350);
    });
}

// ═══════════════════════════════════════════════════════════════
// LEYENDA EMERGENTE
// ═══════════════════════════════════════════════════════════════

function initLegend() {
    const legendBtn = document.getElementById('legend-toggle-btn');
    const legendModal = document.getElementById('legend-modal');

    legendBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        legendModal.classList.toggle('active');
    });

    // Cerrar al hacer click afuera
    document.addEventListener('click', () => {
        legendModal.classList.remove('active');
    });

    legendModal.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Poblar leyenda
    const proyectos = [...new Set(INRA_DATA.map(p => p.proyecto))].sort();
    const counts = {};
    proyectos.forEach(proy => {
        counts[proy] = INRA_DATA.filter(p => p.proyecto === proy).length;
    });

    const legendContent = document.getElementById('legend-content');
    legendContent.innerHTML = '';

    proyectos.forEach(proy => {
        const div = document.createElement('div');
        div.className = 'legend-item';
        const color = getProjectColor(proy);
        div.innerHTML = `
            <div class="legend-dot" style="background: ${color}"></div>
            <span class="legend-label">${proy}</span>
            <span class="legend-count">${counts[proy]}</span>
        `;
        legendContent.appendChild(div);
    });
}

// ═══════════════════════════════════════════════════════════════
// COLOR POR PROYECTO
// ═══════════════════════════════════════════════════════════════

function getProjectColor(proyecto) {
    const colors = {
        'SET-MIN': '#ff6b35', 'SAN-SIM': '#7c3aed', 'CAT-SAN': '#00d4ff', 'RED IGM': '#f0b429',
        'SAN SIM': '#06b6d4', 'SAN-TCO': '#ec4899', 'LA PAZ': '#14b8a6', 'SAN TCO': '#10b981'
    };
    return colors[proyecto] || '#a8dea0';
}

// ═══════════════════════════════════════════════════════════════
// FILTROS
// ═══════════════════════════════════════════════════════════════

function initializeFilters() {
    const proyectos = [...new Set(INRA_DATA.map(p => p.proyecto))].sort();
    const counts = {};
    proyectos.forEach(proy => {
        counts[proy] = INRA_DATA.filter(p => p.proyecto === proy).length;
    });

    const filterGroup = document.getElementById('filter-group');
    filterGroup.innerHTML = '';

    proyectos.forEach(proy => {
        const div = document.createElement('div');
        div.className = 'filter-item';
        const id = 'filter-' + proy.replace(/\s+/g, '-');
        div.innerHTML = `
            <input type="checkbox" id="${id}" value="${proy}" checked>
            <label for="${id}">${proy}</label>
            <span class="filter-count">${counts[proy]}</span>
        `;
        div.querySelector('input').addEventListener('change', applyFilters);
        filterGroup.appendChild(div);
    });
}

function applyFilters() {
    activeFilters.clear();
    document.querySelectorAll('#filter-group input:checked').forEach(cb => {
        activeFilters.add(cb.value);
    });
    performSearch(document.getElementById('search-input').value);
}

// ═══════════════════════════════════════════════════════════════
// BÚSQUEDA
// ═══════════════════════════════════════════════════════════════

function setupSearch() {
    document.getElementById('search-input').addEventListener('input', (e) => {
        performSearch(e.target.value);
    });
}

function performSearch(term) {
    const lowerTerm = term.toLowerCase();
    filteredData = INRA_DATA.filter(p => {
        const matchesSearch = p.nombre.toLowerCase().includes(lowerTerm) ||
                             p.proyecto.toLowerCase().includes(lowerTerm) ||
                             (p.ubicacion && p.ubicacion.toLowerCase().includes(lowerTerm));
        const matchesFilter = activeFilters.size === 0 || activeFilters.has(p.proyecto);
        return matchesSearch && matchesFilter;
    });
    loadPoints(filteredData);
}

// ═══════════════════════════════════════════════════════════════
// RENDERIZAR PUNTOS
// ═══════════════════════════════════════════════════════════════

function loadPoints(data) {
    markers.clearLayers();
    document.getElementById('list-container').innerHTML = '';

    if (data.length === 0) {
        document.getElementById('list-container').innerHTML = '<div style="padding:20px;text-align:center;color:#5a7a5a">🔍 Sin resultados</div>';
        document.getElementById('stat-visible').textContent = 0;
        return;
    }

    const fragment = document.createDocumentFragment();

    data.forEach(p => {
        if (!p.lat || !p.lon) return;

        const color = getProjectColor(p.proyecto);
        const marker = L.circleMarker([p.lat, p.lon], {
            radius: 7, fillColor: color, color: "#fff", weight: 2, fillOpacity: 0.8
        });

        marker.bindPopup(createPopupContent(p), { maxWidth: 380 });
        marker.on('click', () => selectMarker(marker, p));
        markers.addLayer(marker);

        const item = document.createElement('div');
        item.className = 'point-item';
        item.innerHTML = `
            <strong style="color: ${color}">${p.nombre}</strong>
            <small>${p.ubicacion || '-'}</small>
            <div class="point-proyecto">${p.proyecto}</div>
        `;
        item.onclick = () => {
            map.setView([p.lat, p.lon], 14);
            setTimeout(() => marker.openPopup(), 100);
            selectMarker(marker, p);
        };
        fragment.appendChild(item);
    });

    document.getElementById('list-container').appendChild(fragment);
    document.getElementById('stat-visible').textContent = data.length;
}

// ═══════════════════════════════════════════════════════════════
// POPUP
// ═══════════════════════════════════════════════════════════════

function createPopupContent(p) {
    let desc = p.descripcion || '';
    if (desc && desc !== 'nan') desc = desc.trim();

    return `
        <div class="popup-header">${p.nombre}</div>
        <div class="popup-body">
            <div class="popup-field">
                <div class="popup-label">Proyecto</div>
                <div class="popup-value">${p.proyecto || '-'}</div>
            </div>
            <div class="popup-field">
                <div class="popup-label">Ubicación</div>
                <div class="popup-value">${p.ubicacion || '-'}</div>
            </div>
            <div class="popup-field">
                <div class="popup-label">Altura</div>
                <div class="popup-value">${p.alturaEli || '-'} m</div>
            </div>
            <div class="popup-hr"></div>
            <div class="popup-field">
                <div class="popup-label">Coordenadas</div>
                <div class="popup-value"><strong>Lat:</strong> ${p.lat.toFixed(6)}<br><strong>Lon:</strong> ${p.lon.toFixed(6)}</div>
            </div>
            ${desc ? `<div class="popup-field"><div class="popup-label">Descripción</div><div class="popup-value" style="max-height: 150px; overflow-y: auto;">${desc}</div></div>` : ''}
        </div>
    `;
}

// ═══════════════════════════════════════════════════════════════
// SELECCIONAR MARCADOR
// ═══════════════════════════════════════════════════════════════

function selectMarker(marker, point) {
    if (selectedMarker) selectedMarker.setStyle({ fillOpacity: 0.8 });
    selectedMarker = marker;
    marker.setStyle({ fillOpacity: 1, weight: 3, radius: 9 });

    let desc = point.descripcion || '';
    if (desc && desc !== 'nan') desc = desc.trim();

    const infoSection = document.getElementById('info-section');
    infoSection.className = 'sidebar-section';
    infoSection.innerHTML = `
        <div class="info-header">
            <div class="info-id">📍 ${point.id}</div>
            <div class="info-name">${point.nombre}</div>
            <div class="info-project">${point.proyecto}</div>
        </div>
        <div class="info-content">
            <div class="info-field">
                <div class="info-label">Ubicación</div>
                <div class="info-value">${point.ubicacion || '-'}</div>
            </div>
            <div class="info-field">
                <div class="info-label">Latitud</div>
                <div class="info-value">${point.lat.toFixed(7)}</div>
            </div>
            <div class="info-field">
                <div class="info-label">Longitud</div>
                <div class="info-value">${point.lon.toFixed(7)}</div>
            </div>
            <div class="info-field">
                <div class="info-label">Altura Elipsoidal</div>
                <div class="info-value">${point.alturaEli || '-'} m</div>
            </div>
            ${desc ? `<div class="info-field"><div class="info-label">Descripción Completa</div><div class="info-description">${desc}</div></div>` : ''}
        </div>
    `;
}
