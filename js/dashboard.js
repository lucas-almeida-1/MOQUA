import { universities, allInstitutesSectors } from './config.js';
import { showPage, showWaterAlert } from './ui.js';

export function renderGlobalSearch(appInstance, filter = '') {
    const container = document.getElementById('global-search-results');
    if (!container) return;
    container.innerHTML = '';
    const lowerFilter = filter.toLowerCase();

    universities.filter(u => u.name.toLowerCase().includes(lowerFilter)).forEach(uni => {
        container.innerHTML += `
            <div class="bg-white dark:bg-dark-card rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow custom-card" onclick="App.selectUniversity('${uni.id}')">
                <div class="custom-card-image-container">
                    <img src="${uni.logo || 'https://placehold.co/300x150/e2e8f0/94a3b8?text=Logo+Universidade'}" alt="Logo ${uni.name}" class="custom-card-image" onerror="this.src='https://placehold.co/300x150/e2e8f0/94a3b8?text=Logo+Error'">
                </div>
                <div class="custom-card-content">
                    <h3 class="text-xl font-semibold text-primary dark:text-dark-primary">${uni.name}</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Universidade</p>
                </div>
            </div>`;
    });

    allInstitutesSectors.filter(inst => inst.name.toLowerCase().includes(lowerFilter) || (lowerFilter.length >= 2 && inst.id.toLowerCase().includes(lowerFilter)))
        .forEach(inst => {
        if (!universities.some(uni => inst.universityId === uni.id && uni.name.toLowerCase().includes(lowerFilter))) {
             container.innerHTML += `
                <div class="bg-white dark:bg-dark-card rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow custom-card" onclick="App.selectInstituteSector('${inst.id}', true)">
                    <div class="custom-card-image-container">
                        <img src="${inst.logo || 'https://placehold.co/300x150/e2e8f0/94a3b8?text=Logo+Setor'}" alt="Logo ${inst.name}" class="custom-card-image" onerror="this.src='https://placehold.co/300x150/e2e8f0/94a3b8?text=Logo+Error'">
                    </div>
                    <div class="custom-card-content">
                        <h3 class="text-xl font-semibold text-secondary dark:text-dark-secondary">${inst.name}</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400">Setor/Instituto em ${inst.universityName}</p>
                    </div>
                </div>`;
        }
    });
    if(container.innerHTML === '') {
        container.innerHTML = `<p class="text-gray-500 dark:text-gray-400 text-center col-span-full">Nenhum resultado encontrado para "${filter}".</p>`;
    }
}

export function selectUniversity(appInstance, uniId) {
    appInstance.selectedUniversity = universities.find(u => u.id === uniId);
    renderInstituteSectorSelection(appInstance);
    showPage('institute-sector-selection-page', appInstance);
    const titleEl = document.getElementById('institute-sector-search-title');
    const searchEl = document.getElementById('search-institute-sector');
    if (titleEl) titleEl.textContent = `Setores/Institutos em ${appInstance.selectedUniversity.name}`;
    if (searchEl) searchEl.placeholder = `🔎 Buscar setor/instituto da ${appInstance.selectedUniversity.name}...`;
}

export function renderInstituteSectorSelection(appInstance, filter = '') {
    const container = document.getElementById('institute-sector-cards');
    if (!container) return;
    container.innerHTML = '';
    if (!appInstance.selectedUniversity) return;
    const lowerFilter = filter.toLowerCase();

    allInstitutesSectors.filter(inst => inst.universityId === appInstance.selectedUniversity.id && (inst.name.toLowerCase().includes(lowerFilter) || inst.id.toLowerCase().includes(lowerFilter)))
        .forEach(inst => {
        container.innerHTML += `
            <div class="bg-white dark:bg-dark-card rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow custom-card" onclick="App.selectInstituteSector('${inst.id}')">
                <div class="custom-card-image-container">
                    <img src="${inst.logo || 'https://placehold.co/300x150/e2e8f0/94a3b8?text=Logo+Setor'}" alt="Logo ${inst.name}" class="custom-card-image" onerror="this.src='https://placehold.co/300x150/e2e8f0/94a3b8?text=Logo+Error'">
                </div>
                <div class="custom-card-content">
                    <h3 class="text-xl font-semibold text-secondary dark:text-dark-secondary">${inst.name}</h3>
                </div>
            </div>`;
    });
    if(container.innerHTML === '') {
        container.innerHTML = `<p class="text-gray-500 dark:text-gray-400 text-center col-span-full">Nenhum setor/instituto encontrado para "${filter}" em ${appInstance.selectedUniversity.name}.</p>`;
    }
    const searchInput = document.getElementById('search-institute-sector');
    if (searchInput && !searchInput.dataset.listenerAttached) { // Prevent multiple listeners
        searchInput.addEventListener('input', (e) => renderInstituteSectorSelection(appInstance, e.target.value));
        searchInput.dataset.listenerAttached = 'true';
    }
}

export function selectInstituteSector(appInstance, instSecId, fromGlobalSearch = false) {
    appInstance.selectedInstituteSector = allInstitutesSectors.find(i => i.id === instSecId);
    if (fromGlobalSearch && !appInstance.selectedUniversity) {
        appInstance.selectedUniversity = universities.find(u => u.id === appInstance.selectedInstituteSector.universityId);
    }
    clearFilters(appInstance, false, false);
    appInstance.dashboardAlertShownForCurrentInstitute = false;
    renderDashboard(appInstance, true);
    showPage('dashboard-page', appInstance);
}

export function updateTypeFilters(appInstance) {
    appInstance.currentFilters.types = Array.from(document.querySelectorAll('#filter-type input:checked')).map(cb => cb.value);
}

export function updateStatusFilters(appInstance) {
    appInstance.currentFilters.statuses = Array.from(document.querySelectorAll('#filter-status input:checked')).map(cb => cb.value);
}

export function clearFilters(appInstance, render = true, showAlertOnRender = false) {
    appInstance.currentFilters = { name: '', types: [], statuses: [] };
    const filterNameInput = document.getElementById('filter-name-dashboard');
    if (filterNameInput) filterNameInput.value = '';
    document.querySelectorAll('#filter-type input:checked').forEach(cb => cb.checked = false);
    document.querySelectorAll('#filter-status input:checked').forEach(cb => cb.checked = false);
    if (render) renderDashboard(appInstance, showAlertOnRender);
}

export function renderDashboard(appInstance, checkAlert = false) {
    if (!appInstance.selectedInstituteSector) return;
    const dashboardTitle = document.getElementById('dashboard-title');
    if (dashboardTitle) dashboardTitle.textContent = `Qualidade da Água: ${appInstance.selectedInstituteSector.name}`;
    
    const container = document.getElementById('water-points-grid');
    if (!container) return;
    container.innerHTML = '';
    let locations = [...appInstance.selectedInstituteSector.locations];

    if (appInstance.currentFilters.name) locations = locations.filter(loc => loc.name.toLowerCase().includes(appInstance.currentFilters.name));
    if (appInstance.currentFilters.types.length > 0) locations = locations.filter(loc => appInstance.currentFilters.types.includes(loc.type));
    if (appInstance.currentFilters.statuses.length > 0) locations = locations.filter(loc => appInstance.currentFilters.statuses.includes(loc.status));

    const statusOrder = { critical: 0, attention: 1, good: 2 };
    locations.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

    if (locations.length === 0) {
        container.innerHTML = `<p class="text-gray-500 dark:text-gray-400 text-center col-span-full">Nenhum ponto de coleta corresponde aos filtros selecionados.</p>`;
    } else {
        locations.forEach(loc => {
            let statusColor = 'bg-green-100 border-green-500 dark:bg-green-900 dark:border-green-700';
            let statusText = 'Boa';
            let textColor = 'text-green-700 dark:text-green-300';

            if (loc.status === 'attention') {
                statusColor = 'bg-yellow-100 border-yellow-500 dark:bg-yellow-900 dark:border-yellow-600'; statusText = 'Atenção'; textColor = 'text-yellow-700 dark:text-yellow-300';
            } else if (loc.status === 'critical') {
                statusColor = 'bg-red-100 border-red-500 dark:bg-red-900 dark:border-red-700'; statusText = 'Crítico - Imprópria'; textColor = 'text-red-700 dark:text-red-300';
            }
            const cardHTML = `
                <div class="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md border-l-4 ${statusColor}">
                    <h4 class="text-lg font-semibold ${textColor}">${loc.name} (${loc.type})</h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Última Análise: ${loc.lastAnalysis}</p>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Última Limpeza: ${loc.lastCleaning}</p>
                    <div class="mt-4 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                        ${loc.chlorine !== null ? `<p><strong>Nível de Cloro:</strong> ${loc.chlorine} mg/L</p>` : ''}
                        ${loc.fecalColiforms !== null ? `<p><strong>Coliformes Fecais:</strong> ${loc.fecalColiforms} UFC/100mL</p>` : ''}
                        ${loc.turbidity !== null ? `<p><strong>Turbidez:</strong> ${loc.turbidity} NTU</p>` : ''}
                        ${loc.pH !== null ? `<p><strong>pH:</strong> ${loc.pH}</p>` : ''}
                    </div>
                    <p class="mt-3 text-sm font-medium ${textColor}">Status: ${statusText}</p>
                </div>`;
            container.innerHTML += cardHTML;
        });
    }

    if (checkAlert && !appInstance.dashboardAlertShownForCurrentInstitute) {
        const criticalPoint = appInstance.selectedInstituteSector.locations.find(loc => loc.status === 'critical');
        const attentionPoint = appInstance.selectedInstituteSector.locations.find(loc => loc.status === 'attention');
        if (criticalPoint) {
            showWaterAlert(criticalPoint.name);
            appInstance.dashboardAlertShownForCurrentInstitute = true;
        } else if (attentionPoint) {
            showWaterAlert(attentionPoint.name);
            appInstance.dashboardAlertShownForCurrentInstitute = true;
        }
    }
}
