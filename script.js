const firstCube = document.querySelector('.first-cube');
const secondCube = document.querySelector('.second-cube');
const thirdCube = document.querySelector('.third-cube');
const fourthCube = document.querySelector('.fourth-cube');

const HORMUZ_PROXY_BASE_URL = (window.HORMUZ_PROXY_BASE_URL || 'https://your-worker.example.workers.dev').replace(/\/$/, '');
const DEFAULT_DEPENDENCY_COUNTRY = 'US';
const POLL_INTERVALS = {
    risk:    10 * 60 * 1000,
    crisis:  10 * 60 * 1000,
    traffic: 15 * 60 * 1000,
    prices:  15 * 60 * 1000,
    bypass:  30 * 60 * 1000
};

const dashboardElements = {
    riskScore: document.getElementById('risk-score'),
    riskLastUpdated: document.getElementById('risk-last-updated'),
    crisisStatus: document.getElementById('crisis-status'),
    crisisLastUpdated: document.getElementById('crisis-last-updated'),
    oilPrices: document.getElementById('oil-prices'),
    pricesLastUpdated: document.getElementById('prices-last-updated'),
    trafficDisruption: document.getElementById('traffic-disruption'),
    trafficLastUpdated: document.getElementById('traffic-last-updated'),
    riskDetails: document.getElementById('risk-details'),
    crisisFeed: document.getElementById('crisis-feed'),
    trafficData: document.getElementById('traffic-data'),
    pricesData: document.getElementById('prices-data'),
    bypassData: document.getElementById('bypass-data'),
    dependencyData: document.getElementById('dependency-data')
};

function isProxyConfigured() {
    return HORMUZ_PROXY_BASE_URL && !HORMUZ_PROXY_BASE_URL.includes('your-worker.example.workers.dev');
}

function formatTimestamp(value = new Date()) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return 'Last updated: unavailable';
    return `Last updated: ${date.toLocaleString()}`;
}

function setText(element, text) {
    if (element) element.textContent = text;
}

function setState(element, message, state = 'loading') {
    if (!element) return;
    element.classList.remove('loading-state', 'error-state', 'empty-state');
    element.classList.add(`${state}-state`);
    element.textContent = message;
}

function clearState(element) {
    if (!element) return;
    element.classList.remove('loading-state', 'error-state', 'empty-state');
}

function normalizePayload(payload) {
    if (payload && typeof payload === 'object' && 'data' in payload) return payload.data;
    return payload;
}

function getValue(data, keys, fallback = null) {
    if (!data || typeof data !== 'object') return fallback;
    for (const key of keys) {
        if (data[key] !== undefined && data[key] !== null && data[key] !== '') return data[key];
    }
    return fallback;
}

// Try the current level first, then one level deeper (handles APIs that wrap in {data:{...}})
function getValueDeep(data, keys, fallback = null) {
    const shallow = getValue(data, keys);
    if (shallow !== null) return shallow;
    return getValue(normalizePayload(data), keys, fallback);
}

function humanizeKey(key) {
    return key.replace(/[_-]/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

function formatValue(value) {
    if (value === null || value === undefined || value === '') return '—';
    if (Array.isArray(value)) return value.length ? value.map(formatValue).join(', ') : 'None';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
}

// Fields that deserve a bar gauge and their max scale
const GAUGE_FIELDS = {
    risk_score: 10, composite_score: 10, score: 10,
    reduction_pct: 100, traffic_reduction_pct: 100,
    utilisation_pct: 100, utilisation: 100,
    capacity_utilisation: 100, spr_coverage_days: 120
};

function getGaugeMax(key) {
    return GAUGE_FIELDS[key.toLowerCase().replace(/[- ]/g, '_')] || null;
}

function renderGaugeBar(num, max) {
    const pct = Math.min(100, Math.max(0, (num / max) * 100));
    const color = pct > 75 ? '#ff3344' : pct > 40 ? '#ff8800' : '#00ff88';
    const unit = max === 10 ? '/10' : '%';
    return `<div class="gauge-bar-inline"><div class="gauge-bar-track"><div class="gauge-bar-fill" style="width:${pct.toFixed(1)}%;background:${color};box-shadow:0 0 5px ${color}99"></div></div><span class="gauge-bar-num">${num}${unit}</span></div>`;
}

function updateRiskGauge(scoreText) {
    const ring = document.getElementById('risk-gauge-ring');
    if (!ring) return;
    const num = parseFloat(scoreText);
    if (isNaN(num)) return;
    const pct = Math.min(100, (num / 10) * 100);
    const color = pct > 75 ? '#ff3344' : pct > 50 ? '#ff8800' : '#00ff88';
    ring.style.setProperty('--g-pct', pct.toFixed(1));
    ring.style.setProperty('--g-color', color);
}

function applyStatusClass(element, text) {
    if (!element) return;
    const lower = String(text).toLowerCase();
    element.classList.remove('val-success', 'val-warning', 'val-danger');
    if (['success', 'normal', 'low', 'open', 'operational', 'active'].some(s => lower.includes(s))) {
        element.classList.add('val-success');
    } else if (['moderate', 'warning', 'elevated', 'restricted', 'reduced', 'disrupted'].some(s => lower.includes(s))) {
        element.classList.add('val-warning');
    } else if (['critical', 'severe', 'high', 'closed', 'crisis'].some(s => lower.includes(s))) {
        element.classList.add('val-danger');
    }
}

function renderObject(element, data) {
    clearState(element);
    const payload = normalizePayload(data);

    if (!payload || (Array.isArray(payload) && payload.length === 0) || (typeof payload === 'object' && !Array.isArray(payload) && Object.keys(payload).length === 0)) {
        setState(element, 'No data available.', 'empty');
        return;
    }

    if (Array.isArray(payload)) {
        const hasObjects = payload.some(item => typeof item === 'object' && item !== null);
        if (hasObjects) {
            element.innerHTML = payload.map(item => `<div class="item-card">${renderItem(item)}</div>`).join('');
        } else {
            element.innerHTML = `<ul class="item-list">${payload.map(item => `<li>${renderItem(item)}</li>`).join('')}</ul>`;
        }
        return;
    }

    if (typeof payload === 'object') {
        element.innerHTML = Object.entries(payload)
            .map(([key, value]) => {
                const gaugeMax = getGaugeMax(key);
                const valHtml = (gaugeMax !== null && typeof value === 'number')
                    ? renderGaugeBar(value, gaugeMax)
                    : `<span class="data-val">${renderItem(value)}</span>`;
                return `<div class="data-row"><span class="data-key">${escapeHtml(humanizeKey(key))}</span>${valHtml}</div>`;
            })
            .join('');
        return;
    }

    element.textContent = String(payload);
}

function renderItem(item) {
    if (item === null || item === undefined || item === '') return '—';
    if (typeof item === 'boolean') return item ? 'Yes' : 'No';
    if (typeof item === 'number') {
        return Number.isInteger(item) && Math.abs(item) >= 1000
            ? item.toLocaleString()
            : String(item);
    }
    if (typeof item === 'string') {
        // Format ISO date/datetime strings
        if (/^\d{4}-\d{2}-\d{2}/.test(item)) {
            try {
                const d = new Date(item);
                if (!isNaN(d)) {
                    const hasTime = item.includes('T') && !/T00:00:00/.test(item);
                    return escapeHtml(d.toLocaleString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                        ...(hasTime ? { hour: 'numeric', minute: '2-digit' } : {})
                    }));
                }
            } catch (e) {}
        }
        return escapeHtml(item);
    }
    if (Array.isArray(item)) {
        if (!item.length) return 'None';
        if (item.some(v => typeof v === 'object' && v !== null)) {
            return item.map(v => `<div class="item-card">${renderItem(v)}</div>`).join('');
        }
        return `<ul class="item-list">${item.map(v => `<li>${renderItem(v)}</li>`).join('')}</ul>`;
    }
    if (typeof item === 'object') {
        const entries = Object.entries(item);
        if (!entries.length) return '—';
        return entries.map(([k, v]) => {
            const gaugeMax = getGaugeMax(k);
            const valHtml = (gaugeMax !== null && typeof v === 'number')
                ? renderGaugeBar(v, gaugeMax)
                : `<span class="data-val">${renderItem(v)}</span>`;
            return `<div class="nested-row"><span class="data-key">${escapeHtml(humanizeKey(k))}</span>${valHtml}</div>`;
        }).join('');
    }
    return escapeHtml(String(item));
}

function escapeHtml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function fetchProxy(endpoint, query = {}) {
    if (!isProxyConfigured()) {
        throw new Error('Configure window.HORMUZ_PROXY_BASE_URL with your backend proxy URL.');
    }

    const url = new URL(`${HORMUZ_PROXY_BASE_URL}/${endpoint}`);
    Object.entries(query).forEach(([key, value]) => {
        if (value) url.searchParams.set(key, value);
    });

    const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
        throw new Error(body?.error || body?.message || `Request failed with ${response.status}`);
    }
    return normalizePayload(body);
}

async function loadSection(config) {
    const { endpoint, detailElement, panelBadgeElement, lastUpdatedElement, summaryElement, summaryKeys, emptySummary, isStatus, onSummarySet, render } = config;
    setState(detailElement, 'Loading...', 'loading');
    if (summaryElement) setText(summaryElement, 'Loading...');

    try {
        const data = await fetchProxy(endpoint);
        if (render) render(data);
        else renderObject(detailElement, data);

        // getValueDeep tries outer level first, then one level deeper
        // (handles APIs like crisis that return {status:"x", data:[...]} vs risk that returns {data:{score:9.3}})
        const summaryText = formatValue(getValueDeep(data, summaryKeys, emptySummary || '—'));
        const updatedText = formatValue(getValueDeep(data, ['last_updated', 'lastUpdated', 'updated_at', 'timestamp'], null));

        if (summaryElement) {
            setText(summaryElement, summaryText);
            if (isStatus) applyStatusClass(summaryElement, summaryText);
        }
        if (panelBadgeElement) {
            setText(panelBadgeElement, summaryText);
            applyStatusClass(panelBadgeElement, summaryText);
        }
        if (lastUpdatedElement) setText(lastUpdatedElement, formatTimestamp(updatedText !== '—' ? updatedText : new Date()));
        if (onSummarySet) onSummarySet(summaryText);
    } catch (error) {
        setState(detailElement, error.message, 'error');
        if (summaryElement) setText(summaryElement, 'Error');
        if (panelBadgeElement) setText(panelBadgeElement, 'err');
        if (lastUpdatedElement) setText(lastUpdatedElement, 'Last updated: failed');
    }
}

function startPolling(config, interval) {
    loadSection(config);
    return window.setInterval(() => loadSection(config), interval);
}

function setupDashboard() {
    const sections = [
        {
            endpoint: 'risk',
            detailElement: dashboardElements.riskDetails,
            panelBadgeElement: document.getElementById('risk-badge'),
            lastUpdatedElement: dashboardElements.riskLastUpdated,
            summaryElement: dashboardElements.riskScore,
            summaryKeys: ['risk_score', 'score', 'composite_score', 'level'],
            emptySummary: '—',
            onSummarySet: updateRiskGauge
        },
        {
            endpoint: 'crisis',
            detailElement: dashboardElements.crisisFeed,
            panelBadgeElement: document.getElementById('crisis-badge'),
            lastUpdatedElement: dashboardElements.crisisLastUpdated,
            summaryElement: dashboardElements.crisisStatus,
            summaryKeys: ['status', 'crisis_status', 'level', 'headline'],
            emptySummary: '—',
            isStatus: true
        },
        {
            endpoint: 'traffic',
            detailElement: dashboardElements.trafficData,
            panelBadgeElement: document.getElementById('traffic-badge'),
            lastUpdatedElement: dashboardElements.trafficLastUpdated,
            summaryElement: dashboardElements.trafficDisruption,
            summaryKeys: ['traffic_status', 'disruption', 'traffic_disruption', 'status', 'level'],
            emptySummary: '—',
            isStatus: true
        },
        {
            endpoint: 'prices',
            detailElement: dashboardElements.pricesData,
            panelBadgeElement: document.getElementById('prices-badge'),
            lastUpdatedElement: dashboardElements.pricesLastUpdated,
            summaryElement: dashboardElements.oilPrices,
            summaryKeys: ['brent_usd', 'oil_price', 'brent', 'wti_usd', 'wti', 'price', 'summary'],
            emptySummary: '—'
        },
        {
            endpoint: 'bypass',
            detailElement: dashboardElements.bypassData,
            panelBadgeElement: document.getElementById('bypass-badge'),
            summaryKeys: ['status', 'total_capacity', 'available_capacity', 'summary'],
            emptySummary: 'tap to view'
        }
    ];

    sections.forEach((section, index) => {
        setTimeout(() => startPolling(section, POLL_INTERVALS[section.endpoint]), index * 2000);
    });

    loadDependencyCountry(DEFAULT_DEPENDENCY_COUNTRY);
}

async function loadDependencyCountry(country) {
    setState(dashboardElements.dependencyData, `Loading...`, 'loading');
    const badgeEl = document.getElementById('dependency-badge');
    try {
        const data = await fetchProxy('dependency', { country });
        renderObject(dashboardElements.dependencyData, data);
        const summary = getValueDeep(data, ['rank', 'dependency_rank', 'import_dependence', 'gulf_import_share', 'dependency_level'], 'US');
        if (badgeEl) {
            badgeEl.textContent = formatValue(summary);
            applyStatusClass(badgeEl, formatValue(summary));
        }
    } catch (error) {
        setState(dashboardElements.dependencyData, error?.message || String(error), 'error');
        if (badgeEl) badgeEl.textContent = 'err';
    }
}

const audio = new Audio('vapor_music.mp3');
audio.loop = true;
audio.volume = 0.3;

const collidingPairs = new Set();

// First cube variables (moved outside animate function)
let x = 100, y = 100; // Changed starting position
let dx = 4, dy = 4;
let rotationX = 0, rotationY = 0;
let dRx = 0.5, dRy = 0.5;

// Second cube variables (moved outside animate function)
let secondX = 500, secondY = 300; // Changed starting position to be further apart
let secondDx = -3, secondDy = 3;
let secondRotationX = 0, secondRotationY = 0;
let secondDRx = 0.3, secondDRy = 0.8;

// Third cube variables (moved outside animate function)
let thirdX = 300, thirdY = 200; // Changed starting position to be further apart
let thirdDx = 2, thirdDy = -4;
let thirdRotationX = 0, thirdRotationY = 0;
let thirdDRx = 0.7, thirdDRy = 0.4;

// Fourth cube variables (moved outside animate function)
let fourthX = 700, fourthY = 100; // Changed starting position to be further apart
let fourthDx = -2, fourthDy = 3;
let fourthRotationX = 0, fourthRotationY = 0;
let fourthDRx = 0.5, fourthDRy = 0.6;

// Reusable collision calculation function
function calculateCollision(mass1, mass2, u1x, u1y, u2x, u2y) {
    const v1x = ((mass1 - mass2) * u1x + 2 * mass2 * u2x) / (mass1 + mass2);
    const v1y = ((mass1 - mass2) * u1y + 2 * mass2 * u2y) / (mass1 + mass2);
    const v2x = ((mass2 - mass1) * u2x + 2 * mass1 * u1x) / (mass1 + mass2);
    const v2y = ((mass2 - mass1) * u2y + 2 * mass1 * u1y) / (mass1 + mass2);
    return { v1x, v1y, v2x, v2y };
}

// Add particle effect function
function createParticles(startX, startY, color) {
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.width = '8px';
        particle.style.height = '8px';
        particle.style.borderRadius = '50%';
        particle.style.backgroundColor = color;
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '1000';
        document.body.appendChild(particle);

        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 3;
        const pvx = Math.cos(angle) * speed;
        const pvy = Math.sin(angle) * speed;
        let px = startX;
        let py = startY;
        let opacity = 1;

        particle.style.left = px + 'px';
        particle.style.top = py + 'px';

        const animateParticle = () => {
            opacity -= 0.02;
            if (opacity <= 0) {
                particle.remove();
                return;
            }
            px += pvx;
            py += pvy;
            particle.style.left = px + 'px';
            particle.style.top = py + 'px';
            particle.style.opacity = opacity;
            requestAnimationFrame(animateParticle);
        };

        animateParticle();
    }
}

function animate() {
    // Store previous positions for collision detection
    const prevX = x;
    const prevY = y;
    const prevSecondX = secondX;
    const prevSecondY = secondY;
    const prevThirdX = thirdX;
    const prevThirdY = thirdY;
    const prevFourthX = fourthX;
    const prevFourthY = fourthY;

    // First cube animation
    if (x + 130 > window.innerWidth || x < 0) dx = -dx;
    if (y + 130 > window.innerHeight || y < 0) dy = -dy;

    x += dx;
    y += dy;

    rotationX += dRx;
    rotationY += dRy;

    firstCube.style.left = x + 'px';
    firstCube.style.top = y + 'px';
    firstCube.style.transform = 'rotateX(' + rotationX + 'deg) rotateY(' + rotationY + 'deg)';

    // Second cube animation (with different starting position and speed)
    if (secondX + 130 > window.innerWidth || secondX < 0) secondDx = -secondDx;
    if (secondY + 130 > window.innerHeight || secondY < 0) secondDy = -secondDy;

    secondX += secondDx;
    secondY += secondDy;

    secondRotationX += secondDRx;
    secondRotationY += secondDRy;

    secondCube.style.left = secondX + 'px';
    secondCube.style.top = secondY + 'px';
    secondCube.style.transform = 'rotateX(' + secondRotationX + 'deg) rotateY(' + secondRotationY + 'deg)';

    // Third cube animation
    if (thirdX + 130 > window.innerWidth || thirdX < 0) thirdDx = -thirdDx;
    if (thirdY + 130 > window.innerHeight || thirdY < 0) thirdDy = -thirdDy;

    thirdX += thirdDx;
    thirdY += thirdDy;

    thirdRotationX += thirdDRx;
    thirdRotationY += thirdDRy;

    thirdCube.style.left = thirdX + 'px';
    thirdCube.style.top = thirdY + 'px';
    thirdCube.style.transform = 'rotateX(' + thirdRotationX + 'deg) rotateY(' + thirdRotationY + 'deg)';

    // Fourth cube animation
    if (fourthX + 130 > window.innerWidth || fourthX < 0) fourthDx = -fourthDx;
    if (fourthY + 130 > window.innerHeight || fourthY < 0) fourthDy = -fourthDy;

    fourthX += fourthDx;
    fourthY += fourthDy;

    fourthRotationX += fourthDRx;
    fourthRotationY += fourthDRy;

    fourthCube.style.left = fourthX + 'px';
    fourthCube.style.top = fourthY + 'px';
    fourthCube.style.transform = 'rotateX(' + fourthRotationX + 'deg) rotateY(' + fourthRotationY + 'deg)';

    // Collision detection - only check unique pairs once
    const cubes = [
        { x: x, y: y, dx: dx, dy: dy, prevX: prevX, prevY: prevY, id: 0 },
        { x: secondX, y: secondY, dx: secondDx, dy: secondDy, prevX: prevSecondX, prevY: prevSecondY, id: 1 },
        { x: thirdX, y: thirdY, dx: thirdDx, dy: thirdDy, prevX: prevThirdX, prevY: prevThirdY, id: 2 },
        { x: fourthX, y: fourthY, dx: fourthDx, dy: fourthDy, prevX: prevFourthX, prevY: prevFourthY, id: 3 }
    ];

    // Check all unique pairs of cubes
    for (let i = 0; i < cubes.length; i++) {
        for (let j = i + 1; j < cubes.length; j++) {
            const cube1 = cubes[i];
            const cube2 = cubes[j];
            const pairKey = `${i}-${j}`;

            const distance = Math.sqrt((cube1.x - cube2.x) ** 2 + (cube1.y - cube2.y) ** 2);
            if (distance < 130) {
                // Relative velocity from position deltas; only respond when cubes are approaching
                const relVx = (cube1.x - cube1.prevX) - (cube2.x - cube2.prevX);
                const relVy = (cube1.y - cube1.prevY) - (cube2.y - cube2.prevY);
                const sepX = cube1.x - cube2.x;
                const sepY = cube1.y - cube2.y;
                const approaching = (relVx * sepX + relVy * sepY) < 0;

                if (approaching) {
                    if (!collidingPairs.has(pairKey)) {
                        const neonColors = ['#ff00aa', '#00eeff', '#9900ff', '#ff8800'];
                        createParticles(cube1.x, cube1.y, neonColors[Math.floor(Math.random() * neonColors.length)]);
                    }
                    collidingPairs.add(pairKey);

                    const { v1x, v1y, v2x, v2y } = calculateCollision(1, 1, cube1.dx, cube1.dy, cube2.dx, cube2.dy);

                    if (cube1.id === 0) { dx = v1x; dy = v1y; }
                    else if (cube1.id === 1) { secondDx = v1x; secondDy = v1y; }
                    else if (cube1.id === 2) { thirdDx = v1x; thirdDy = v1y; }
                    else { fourthDx = v1x; fourthDy = v1y; }

                    if (cube2.id === 0) { dx = v2x; dy = v2y; }
                    else if (cube2.id === 1) { secondDx = v2x; secondDy = v2y; }
                    else if (cube2.id === 2) { thirdDx = v2x; thirdDy = v2y; }
                    else { fourthDx = v2x; fourthDy = v2y; }

                    // Update snapshot so later pairs in the same frame see the new velocities
                    cubes[i].dx = v1x; cubes[i].dy = v1y;
                    cubes[j].dx = v2x; cubes[j].dy = v2y;
                } else {
                    collidingPairs.delete(pairKey);
                }

                if (distance < 100) {
                    const angle = Math.atan2(cube1.y - cube2.y, cube1.x - cube2.x);
                    const moveX = Math.cos(angle) * 35;
                    const moveY = Math.sin(angle) * 35;

                    if (cube1.id === 0) { x += moveX; y += moveY; }
                    else if (cube1.id === 1) { secondX += moveX; secondY += moveY; }
                    else if (cube1.id === 2) { thirdX += moveX; thirdY += moveY; }
                    else { fourthX += moveX; fourthY += moveY; }

                    if (cube2.id === 0) { x -= moveX; y -= moveY; }
                    else if (cube2.id === 1) { secondX -= moveX; secondY -= moveY; }
                    else if (cube2.id === 2) { thirdX -= moveX; thirdY -= moveY; }
                    else { fourthX -= moveX; fourthY -= moveY; }
                }
            } else {
                collidingPairs.delete(pairKey);
            }
        }
    }

    requestAnimationFrame(animate);
}

function setupCubeClick(cube, dxVar, dyVar) {
    if (!cube) return;
    cube.addEventListener('click', function() {
        // Change direction on click
        if (dxVar === 'dx') { dx = -dx; }
        else if (dxVar === 'secondDx') { secondDx = -secondDx; }
        else if (dxVar === 'thirdDx') { thirdDx = -thirdDx; }
        else if (dxVar === 'fourthDx') { fourthDx = -fourthDx; }

        if (dyVar === 'dy') { dy = -dy; }
        else if (dyVar === 'secondDy') { secondDy = -secondDy; }
        else if (dyVar === 'thirdDy') { thirdDy = -thirdDy; }
        else if (dyVar === 'fourthDy') { fourthDy = -fourthDy; }

        // Change image randomly
        const images = ['obama.png', 'trump.jpg', 'biden.jpg', 'rigby.jpg'];
        const randomImage = images[Math.floor(Math.random() * images.length)];
        this.querySelectorAll('.face img').forEach(img => {
            img.src = randomImage;
        });

        // Add glow effect
        this.style.boxShadow = '0 0 30px rgba(255, 255, 255, 0.8)';
        setTimeout(() => {
            this.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.5)';
        }, 500);
    });
}

document.addEventListener('DOMContentLoaded', function() {
  setupDashboard();
  setupCubeClick(firstCube, 'dx', 'dy');
  setupCubeClick(secondCube, 'secondDx', 'secondDy');
  setupCubeClick(thirdCube, 'thirdDx', 'thirdDy');
  setupCubeClick(fourthCube, 'fourthDx', 'fourthDy');
  animate();

  // Audio toggle button
  const audioToggle = document.getElementById('audio-toggle');

  function markPlaying() {
    if (audioToggle) audioToggle.textContent = '⏸ Music';
  }

  // Try to autoplay immediately; browsers usually block this but it works
  // in some contexts (returning visitor, user gesture from previous page, etc.)
  audio.play().then(markPlaying).catch(() => {});

  // Guarantee music starts on the very first user interaction anywhere
  document.addEventListener('click', function startAudio() {
    if (audio.paused) {
      audio.play().then(markPlaying).catch(() => {});
    }
    document.removeEventListener('click', startAudio, { capture: true });
  }, { capture: true, once: true });

  if (audioToggle) {
    audioToggle.addEventListener('click', function(e) {
      e.stopPropagation();
      if (audio.paused) {
        audio.play().then(markPlaying).catch(() => {});
      } else {
        audio.pause();
        audioToggle.textContent = '▶ Music';
      }
    });
  }

  // Expandable panels — click the panel-header to toggle detail visibility
  document.querySelectorAll('.dashboard-panel:not(.donations-panel)').forEach(function(panel) {
    const header = panel.querySelector('.panel-header');
    if (header) {
      header.addEventListener('click', function() {
        panel.classList.toggle('expanded');
      });
    }
  });
});
