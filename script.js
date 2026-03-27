// ═══════════════════════════════════════════════════════════════
// RED GEODÉSICA INRA - SCRIPT PRINCIPAL (v2 - Mobile Optimized)
// ═══════════════════════════════════════════════════════════════

const INRA_DATA = window.DATA_INRA || [];
let map;
let markers = L.markerClusterGroup({ maxClusterRadius: 80, disableClusteringAtZoom: 16 });
let filteredData = INRA_DATA;
let selectedMarker = null;
let activeFilters = new Set();
let isFullscreen = false;
let locationWatchId = null;
let locationMarker = null;
let locationCircle = null;
let isMobile = window.innerWidth <= 768;

// ═══════════════════════════════════════════════════════════════
// INICIALIZACIÓN
// ═══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    initDisclaimer();
    initMap();
    initToggleButtons();
    initLegend();
    initializeFilters();
    initFilterActions();
    loadPoints(INRA_DATA);
    setupSearch();
    initLocation();
    initMobileBar();
    handleResize();
    window.addEventListener('resize', handleResize);
    console.log('✅ Red Geodésica INRA v2 — Aplicación iniciada');
});

// ═══════════════════════════════════════════════════════════════
// DISCLAIMER
// ═══════════════════════════════════════════════════════════════

function initDisclaimer() {
    const overlay = document.getElementById('disclaimer-overlay');
    const btn = document.getElementById('disclaimer-accept');
    const accepted = sessionStorage.getItem('disclaimer-accepted');

    if (accepted) {
        overlay.classList.add('hidden');
        return;
    }

    btn.addEventListener('click', () => {
        overlay.classList.add('hidden');
        sessionStorage.setItem('disclaimer-accepted', '1');
    });
}

// ═══════════════════════════════════════════════════════════════
// RESPONSIVE HANDLER
// ═══════════════════════════════════════════════════════════════

function handleResize() {
    const wasMobile = isMobile;
    isMobile = window.innerWidth <= 768;

    if (wasMobile !== isMobile) {
        // Reset states when switching between mobile/desktop
        const left = document.getElementById('sidebar-left');
        const right = document.getElementById('sidebar-right');

        if (isMobile) {
            left.classList.remove('collapsed');
            right.classList.remove('collapsed');
            left.classList.remove('mobile-open');
            right.classList.remove('mobile-open');
        } else {
            left.classList.remove('mobile-open');
            right.classList.remove('mobile-open');
        }
    }

    setTimeout(() => map && map.invalidateSize(), 100);
}

// ═══════════════════════════════════════════════════════════════
// MAPA
// ═══════════════════════════════════════════════════════════════

function initMap() {
    map = L.map('map', {
        zoomControl: true,
        attributionControl: true
    }).setView([-17.0, -65.0], 6);

    const cartodb = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com/">CARTO</a>',
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

    L.control.layers({
        'CartoDB Claro': cartodb,
        'OpenStreetMap': osm,
        'Satélite': satellite
    }).addTo(map);

    map.addLayer(markers);
}

// ═══════════════════════════════════════════════════════════════
// TOGGLE BUTTONS (Desktop)
// ═══════════════════════════════════════════════════════════════

function initToggleButtons() {
    const toggleLeft = document.getElementById('toggle-left');
    const toggleRight = document.getElementById('toggle-right');
    const sidebarLeft = document.getElementById('sidebar-left');
    const sidebarRight = document.getElementById('sidebar-right');

    toggleLeft.addEventListener('click', () => {
        sidebarLeft.classList.toggle('collapsed');
        toggleLeft.classList.toggle('sidebar-collapsed');
        updateToggleIcon(toggleLeft, sidebarLeft.classList.contains('collapsed'), 'left');
        setTimeout(() => map.invalidateSize(), 350);
    });

    toggleRight.addEventListener('click', () => {
        sidebarRight.classList.toggle('collapsed');
        toggleRight.classList.toggle('sidebar-collapsed');
        updateToggleIcon(toggleRight, sidebarRight.classList.contains('collapsed'), 'right');
        setTimeout(() => map.invalidateSize(), 350);
    });

    // Fullscreen
    document.getElementById('fullscreen-btn').addEventListener('click', () => {
        isFullscreen = !isFullscreen;
        document.body.classList.toggle('fullscreen-mode', isFullscreen);
        const btn = document.getElementById('fullscreen-btn');

        if (isFullscreen) {
            btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14h6v6m10-10h-6V4M4 10h6V4m10 10h-6v6"/></svg>';
            btn.title = 'Salir de pantalla completa';
        } else {
            btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>';
            btn.title = 'Pantalla completa';
        }

        setTimeout(() => map.invalidateSize(), 350);
    });
}

function updateToggleIcon(btn, isCollapsed, side) {
    if (side === 'left') {
        btn.innerHTML = isCollapsed
            ? '<svg width="10" height="16" viewBox="0 0 10 16" fill="none"><path d="M1 1L9 8L1 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
            : '<svg width="10" height="16" viewBox="0 0 10 16" fill="none"><path d="M9 1L1 8L9 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    } else {
        btn.innerHTML = isCollapsed
            ? '<svg width="10" height="16" viewBox="0 0 10 16" fill="none"><path d="M9 1L1 8L9 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
            : '<svg width="10" height="16" viewBox="0 0 10 16" fill="none"><path d="M1 1L9 8L1 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }
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

    document.addEventListener('click', (e) => {
        if (!legendModal.contains(e.target) && e.target !== legendBtn) {
            legendModal.classList.remove('active');
        }
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
// UBICACIÓN EN TIEMPO REAL
// ═══════════════════════════════════════════════════════════════

function initLocation() {
    const btn = document.getElementById('location-btn');
    if (!btn) return;

    btn.addEventListener('click', toggleLocation);
}

function toggleLocation() {
    const btn = document.getElementById('location-btn');

    if (locationWatchId !== null) {
        // Desactivar
        navigator.geolocation.clearWatch(locationWatchId);
        locationWatchId = null;
        if (locationMarker) { map.removeLayer(locationMarker); locationMarker = null; }
        if (locationCircle) { map.removeLayer(locationCircle); locationCircle = null; }
        btn.classList.remove('tracking');
        // Update mobile button too
        const mobileBtn = document.getElementById('mobile-location-btn');
        if (mobileBtn) mobileBtn.classList.remove('active');
        return;
    }

    if (!navigator.geolocation) {
        alert('Tu navegador no soporta geolocalización.');
        return;
    }

    btn.classList.add('tracking');
    const mobileBtn = document.getElementById('mobile-location-btn');
    if (mobileBtn) mobileBtn.classList.add('active');

    locationWatchId = navigator.geolocation.watchPosition(
        (pos) => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            const acc = pos.coords.accuracy;

            if (!locationMarker) {
                const icon = L.divIcon({
                    className: 'location-pulse',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                });
                locationMarker = L.marker([lat, lon], { icon, zIndexOffset: 1000 }).addTo(map);
                locationCircle = L.circle([lat, lon], {
                    radius: acc,
                    color: '#2563eb',
                    fillColor: '#2563eb',
                    fillOpacity: 0.1,
                    weight: 1
                }).addTo(map);
                map.setView([lat, lon], 14);
            } else {
                locationMarker.setLatLng([lat, lon]);
                locationCircle.setLatLng([lat, lon]);
                locationCircle.setRadius(acc);
            }
        },
        (err) => {
            console.warn('Error de geolocalización:', err.message);
            alert('No se pudo obtener tu ubicación. Verifica los permisos de tu navegador.');
            btn.classList.remove('tracking');
            if (mobileBtn) mobileBtn.classList.remove('active');
            locationWatchId = null;
        },
        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 5000
        }
    );
}

// ═══════════════════════════════════════════════════════════════
// MOBILE BOTTOM BAR
// ═══════════════════════════════════════════════════════════════

function initMobileBar() {
    const searchBtn = document.getElementById('mobile-search-btn');
    const filterBtn = document.getElementById('mobile-filter-btn');
    const legendBtn = document.getElementById('mobile-legend-btn');
    const locationBtn = document.getElementById('mobile-location-btn');

    if (!searchBtn) return;

    searchBtn.addEventListener('click', () => {
        toggleMobilePanel('sidebar-left');
        updateMobileActiveBtn('mobile-search-btn');
    });

    filterBtn.addEventListener('click', () => {
        toggleMobilePanel('sidebar-right');
        updateMobileActiveBtn('mobile-filter-btn');
    });

    legendBtn.addEventListener('click', () => {
        closeMobilePanels();
        const legendModal = document.getElementById('legend-modal');
        legendModal.classList.toggle('active');
        updateMobileActiveBtn(legendModal.classList.contains('active') ? 'mobile-legend-btn' : null);
    });

    locationBtn.addEventListener('click', () => {
        closeMobilePanels();
        toggleLocation();
    });
}

function toggleMobilePanel(panelId) {
    const panel = document.getElementById(panelId);
    const otherId = panelId === 'sidebar-left' ? 'sidebar-right' : 'sidebar-left';
    const other = document.getElementById(otherId);

    // Close legend
    document.getElementById('legend-modal').classList.remove('active');

    // Close other panel
    other.classList.remove('mobile-open');

    // Toggle this panel
    panel.classList.toggle('mobile-open');

    setTimeout(() => map && map.invalidateSize(), 350);
}

function closeMobilePanels() {
    document.getElementById('sidebar-left').classList.remove('mobile-open');
    document.getElementById('sidebar-right').classList.remove('mobile-open');
    updateMobileActiveBtn(null);
}

function updateMobileActiveBtn(activeId) {
    document.querySelectorAll('.mobile-bar-btn').forEach(btn => {
        btn.classList.toggle('active', btn.id === activeId);
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

function initFilterActions() {
    const selectAll = document.getElementById('select-all-btn');
    const deselectAll = document.getElementById('deselect-all-btn');

    if (selectAll) {
        selectAll.addEventListener('click', () => {
            document.querySelectorAll('#filter-group input').forEach(cb => cb.checked = true);
            applyFilters();
        });
    }

    if (deselectAll) {
        deselectAll.addEventListener('click', () => {
            document.querySelectorAll('#filter-group input').forEach(cb => cb.checked = false);
            applyFilters();
        });
    }
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
    const listContainer = document.getElementById('list-container');
    listContainer.innerHTML = '';

    if (data.length === 0) {
        listContainer.innerHTML = '<div style="padding:24px;text-align:center;color:#5a7a5a;font-size:0.9rem">Sin resultados</div>';
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
            // On mobile, close the search panel
            if (isMobile) {
                closeMobilePanels();
            }
        };
        fragment.appendChild(item);
    });

    listContainer.appendChild(fragment);
    document.getElementById('stat-visible').textContent = data.length;
}

// ═══════════════════════════════════════════════════════════════
// POPUP
// ═══════════════════════════════════════════════════════════════

function createPopupContent(p) {
    let desc = p.descripcion || '';
    if (desc && desc !== 'nan') desc = desc.trim();
    else desc = '';

    const color = getProjectColor(p.proyecto);

    return `
        <div class="popup-header">
            <div class="popup-header-top">
                <span class="popup-id-badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>${p.id}</span>
            </div>
            <div class="popup-title">${p.nombre}</div>
            <div class="popup-project-badge">
                <span class="popup-project-dot" style="background:${color}"></span>
                ${p.proyecto || '-'}
            </div>
        </div>
        <div class="popup-body">
            <div class="popup-row">
                <div class="popup-row-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <div class="popup-row-content">
                    <div class="popup-label">Ubicación</div>
                    <div class="popup-value">${p.ubicacion || '-'}</div>
                </div>
            </div>
            <div class="popup-row">
                <div class="popup-row-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3L8 21M8 3L4 7M8 3L12 7M16 21L16 3M16 21L20 17M16 21L12 17"/></svg>
                </div>
                <div class="popup-row-content">
                    <div class="popup-label">Altura Elipsoidal</div>
                    <div class="popup-value">${p.alturaEli != null && p.alturaEli !== '' ? p.alturaEli + ' m' : '-'}</div>
                </div>
            </div>
            <div class="popup-coords-grid">
                <div class="popup-coord-box">
                    <div class="popup-label">Latitud</div>
                    <div class="popup-coord-value">${p.lat.toFixed(6)}</div>
                </div>
                <div class="popup-coord-box">
                    <div class="popup-label">Longitud</div>
                    <div class="popup-coord-value">${p.lon.toFixed(6)}</div>
                </div>
            </div>
            ${desc ? `
            <div class="popup-row popup-desc-row">
                <div class="popup-row-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                </div>
                <div class="popup-row-content">
                    <div class="popup-label">Descripción</div>
                    <div class="popup-value popup-desc-value">${desc}</div>
                </div>
            </div>` : ''}
        </div>
    `;
}

// ═══════════════════════════════════════════════════════════════
// SELECCIONAR MARCADOR
// ═══════════════════════════════════════════════════════════════

function selectMarker(marker, point) {
    if (selectedMarker) selectedMarker.setStyle({ fillOpacity: 0.8, weight: 2, radius: 7 });
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
            ${desc ? `<div class="info-field"><div class="info-label">Descripción</div><div class="info-description">${desc}</div></div>` : ''}
        </div>
    `;
}
