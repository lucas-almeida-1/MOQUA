import { 
    loadAndDisplayComplaints, 
    stopListeningToComplaints, 
    loadNotificationPreferences, 
    renderManagerDashboard
} from './manager.js'; 

export function initTheme() {
    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        setTheme('dark');
    } else {
        setTheme('light');
    }
}

export function setTheme(theme) {
    const headerLogo = document.getElementById('header-logo');
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        document.getElementById('theme-toggle-dark')?.classList.add('active');
        document.getElementById('theme-toggle-light')?.classList.remove('active');
        if (headerLogo) {
            headerLogo.src = 'assets/images/wms_logo_square_icon_dark.png';
        }
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        document.getElementById('theme-toggle-light')?.classList.add('active');
        document.getElementById('theme-toggle-dark')?.classList.remove('active');
        if (headerLogo) {
            headerLogo.src = 'assets/images/wms_logo_square_icon.png';
        }
    }
}

export function showPage(pageId, appInstance) {
    const previousPage = appInstance ? appInstance.currentPage : null;

    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    if (appInstance) { 
        appInstance.currentPage = pageId;
    }
    window.scrollTo(0, 0);

    // Para o listener de reclamações se estivermos saindo da página do gestor
    if (previousPage === 'manager-dashboard-page' && pageId !== 'manager-dashboard-page') {
        if (typeof stopListeningToComplaints === 'function') { // Verifica se a função existe
            stopListeningToComplaints();
        }
    }

    if (pageId === 'dashboard-page' && appInstance) {
        appInstance.dashboardAlertShownForCurrentInstitute = false;
    }
    
    if (pageId === 'manager-dashboard-page' && appInstance) {
        appInstance.editingNotificationPrefs = false; 
        // A função renderManagerDashboard agora também atualiza o nome do gestor.
        if (typeof renderManagerDashboard === 'function') renderManagerDashboard(appInstance); 
        if (typeof loadNotificationPreferences === 'function') loadNotificationPreferences(appInstance); 
        if (typeof loadAndDisplayComplaints === 'function') loadAndDisplayComplaints(appInstance);
    }
}

export function setupModalEventListeners(appInstance) {
    document.querySelectorAll('[data-modal-target]').forEach(button => {
        button.addEventListener('click', (event) => {
            const modalId = event.currentTarget.getAttribute('data-modal-target');
            const modal = document.getElementById(modalId);
            if (modal) {
                 if (modalId === 'complaint-modal' && appInstance?.resetComplaintModal) appInstance.resetComplaintModal();
                 modal.style.display = 'block';
            }
        });
    });
    document.querySelectorAll('.modal .close-button').forEach(button => {
        button.addEventListener('click', () => { button.closest('.modal').style.display = 'none'; });
    });
    window.addEventListener('click', (event) => {
        document.querySelectorAll('.modal').forEach(modal => { if (event.target == modal) modal.style.display = 'none'; });
    });
}

export function showWaterAlert(locationName) {
    const alertModal = document.getElementById('water-alert-modal');
    const alertMessage = document.getElementById('water-alert-message');
    if (alertMessage && alertModal) {
        alertMessage.textContent = `Atenção! A qualidade da água em "${locationName}" pode estar comprometida. Evite o uso. Os gestores já foram notificados e estão tomando as devidas providências.`;
        alertModal.style.display = 'block';
    } else {
        console.error("Elemento 'water-alert-message' ou 'water-alert-modal' não encontrado no DOM.");
    }
}

export function showErrorPopup(fieldId, message, errorPopupTimeouts) {
    const errorElement = document.getElementById(`${fieldId}-error-popup`);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');

        if (errorPopupTimeouts && errorPopupTimeouts[fieldId]) clearTimeout(errorPopupTimeouts[fieldId]);
        
        if(errorPopupTimeouts){ 
            errorPopupTimeouts[fieldId] = setTimeout(() => {
                errorElement.classList.remove('show');
            }, 4000);
        } else { 
             setTimeout(() => {
                errorElement.classList.remove('show');
            }, 4000);
        }
    }
}

export function showNotificationModal(message, type = 'info') {
    const modal = document.getElementById('notification-modal');
    const messageEl = document.getElementById('notification-message');
    const iconContainer = document.getElementById('notification-icon-container');

    if (modal && messageEl && iconContainer) {
        messageEl.textContent = message;
        let iconSvg = '';
        if (type === 'error') iconSvg = '<svg class="mx-auto mb-4 w-16 h-16 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
        else if (type === 'success') iconSvg = '<svg class="mx-auto mb-4 w-16 h-16 text-green-500 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
        else iconSvg = '<svg class="mx-auto mb-4 w-16 h-16 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
        iconContainer.innerHTML = iconSvg;
        modal.style.display = 'block';
    } else {
        console.error("Elementos do modal de notificação não encontrados no DOM.");
    }
}

export function goBack(appInstance, targetPage) {
    if (appInstance.currentPage === 'manager-dashboard-page' && targetPage !== 'manager-dashboard-page') {
        if (typeof stopListeningToComplaints === 'function') {
            stopListeningToComplaints();
        }
    }
    if (targetPage === 'initial-page') { 
        appInstance.selectedUniversity = null; 
        appInstance.selectedInstituteSector = null; 
        appInstance.renderGlobalSearch?.(); 
    } else if (targetPage === 'institute-sector-selection-page') { 
        appInstance.selectedInstituteSector = null; 
    }
    showPage(targetPage, appInstance);
}