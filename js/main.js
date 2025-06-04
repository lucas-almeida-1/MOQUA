import { 
    db as firestoreDB, 
    auth as firebaseAuth, 
    getCurrentUserId, 
    app as firebaseApp, 
    authReadyPromise // Import the promise
} from './firebase.js';
import { initTheme, setTheme, showPage as displayPage, setupModalEventListeners, goBack as navigateBack } from './ui.js';
import { 
    renderGlobalSearch as renderGlobal, 
    selectUniversity as selectUni, 
    renderInstituteSectorSelection as renderInstSecSel,
    selectInstituteSector as selectInstSec,
    updateTypeFilters as updateTypeF,
    updateStatusFilters as updateStatusF,
    clearFilters as clearF,
    renderDashboard as renderDash
} from './dashboard.js';
import { setupComplaintFormEventListeners, resetComplaintModal as resetComplaint } from './complaint.js';
import { setupManagerEventListeners, renderManagerDashboard as renderManagerDash, updateNotificationInputsState as updateManagerInputs } from './manager.js';

window.App = {
    // State
    currentPage: 'initial-page',
    selectedUniversity: null,
    selectedInstituteSector: null,
    currentFilters: { name: '', types: [], statuses: [] },
    db: null,
    auth: null,
    firebaseApp: null, 
    currentUserId: getCurrentUserId, // Function reference
    lastAiAnalysisText: null,
    errorPopupTimeouts: {},
    editingNotificationPrefs: false,
    dashboardAlertShownForCurrentInstitute: false,
    currentPdfDataUrl: null,

    // Initialization
    init: function() {
        this.db = firestoreDB;
        this.auth = firebaseAuth;
        this.firebaseApp = firebaseApp;

        initTheme();
        this.showPage(this.currentPage); // Use App's showPage
        setupModalEventListeners(this);
        this.renderGlobalSearch(); // Use App's renderGlobalSearch

        // Setup event listeners
        this.setupGlobalEventListeners();
        setupComplaintFormEventListeners(this);
        setupManagerEventListeners(this);

        // Ensure filter options are visible
        const filterOptions = document.getElementById('filter-options');
        if (filterOptions) filterOptions.style.display = 'grid'; // Or 'flex'
    },

    setupGlobalEventListeners: function() {
        document.getElementById('search-global')?.addEventListener('input', (e) => this.filterGlobalSearch(e.target.value));
        
        document.getElementById('filter-name-dashboard')?.addEventListener('input', (e) => { this.currentFilters.name = e.target.value.toLowerCase(); this.renderDashboard(false); });
        document.querySelectorAll('#filter-type input[type="checkbox"]').forEach(cb => cb.addEventListener('change', () => {this.updateTypeFilters(); this.renderDashboard(false)}));
        document.querySelectorAll('#filter-status input[type="checkbox"]').forEach(cb => cb.addEventListener('change', () => {this.updateStatusFilters(); this.renderDashboard(false)}));
        document.getElementById('clear-filters-btn')?.addEventListener('click', () => this.clearFilters(true, false));

        document.getElementById('theme-toggle-light')?.addEventListener('click', () => setTheme('light'));
        document.getElementById('theme-toggle-dark')?.addEventListener('click', () => setTheme('dark'));
        
        // Manager dashboard: "Return to Public Dashboard" button
        document.getElementById('return-to-dashboard-btn')?.addEventListener('click', () => this.goBack(this.selectedInstituteSector ? 'dashboard-page' : (this.selectedUniversity ? 'institute-sector-selection-page' : 'initial-page')));
        
        // Public dashboard: "Restricted Access" button
        const loginButtonDashboard = document.getElementById('dashboard-login-btn');
        if(loginButtonDashboard) loginButtonDashboard.addEventListener('click', () => this.showPage('login-page'));

        // Back buttons with specific IDs
        const instituteSectorPageBackButton = document.getElementById('back-to-global-search-btn');
        if(instituteSectorPageBackButton) instituteSectorPageBackButton.addEventListener('click', () => this.goBack('initial-page'));

        const dashboardPageBackButton = document.getElementById('dashboard-back-btn');
        if(dashboardPageBackButton) dashboardPageBackButton.addEventListener('click', () => this.goBack(this.selectedUniversity && this.selectedInstituteSector && this.selectedUniversity.institutes.includes(this.selectedInstituteSector.id) ? 'institute-sector-selection-page' : 'initial-page'));
        
        const loginPageBackButton = document.getElementById('login-back-btn');
        if(loginPageBackButton) loginPageBackButton.addEventListener('click', () => this.goBack(this.selectedInstituteSector ? 'dashboard-page' : (this.selectedUniversity ? 'institute-sector-selection-page' : 'initial-page')));

    },

    // UI Methods (delegating or direct)
    showPage: function(pageId) { displayPage(pageId, this); },
    goBack: function(targetPage) { navigateBack(this, targetPage); },

    // Dashboard Methods
    renderGlobalSearch: function(filter = '') { renderGlobal(this, filter); },
    filterGlobalSearch: function(query) { this.renderGlobalSearch(query); },
    selectUniversity: function(uniId) { selectUni(this, uniId); },
    renderInstituteSectorSelection: function(filter = '') { renderInstSecSel(this, filter); },
    selectInstituteSector: function(instSecId, fromGlobalSearch = false) { selectInstSec(this, instSecId, fromGlobalSearch); },
    updateTypeFilters: function() { updateTypeF(this); },
    updateStatusFilters: function() { updateStatusF(this); },
    clearFilters: function(render = true, showAlertOnRender = false) { clearF(this, render, showAlertOnRender); },
    renderDashboard: function(checkAlert = false) { renderDash(this, checkAlert); },
    
    // Complaint Methods
    resetComplaintModal: function() { resetComplaint(this); },

    // Manager Methods
    renderManagerDashboard: function() { renderManagerDash(this); },
    updateNotificationInputsState: function() { updateManagerInputs(this); },
    // analyzeSituationWithAI, generateAndShowPdf, downloadPdf are called from manager.js setupManagerEventListeners

};

window.addEventListener('DOMContentLoaded', async () => {
    try {
        await authReadyPromise; // Wait for Firebase auth to be ready
        
        // firebaseApp is imported and should be defined if firebase.js loaded and initialized successfully.
        // The authReadyPromise ensures onAuthStateChanged has completed its first run.
        if (firebaseApp) { 
            App.init();
        } else {
            // This case means Firebase app initialization itself failed in firebase.js or was skipped due to placeholder.
            console.error("Instância do Firebase App não foi criada ou falhou. App não pode iniciar completamente com funcionalidades Firebase.");
            // Initialize the App object anyway to set up UI and non-Firebase parts.
            // App.init() should be robust enough to handle firebaseApp, db, auth being null.
            App.init(); // Call App.init() here

            initTheme(); // initTheme is also called within App.init, but calling here ensures theme is set early.
            
            // Display a more user-friendly, less disruptive message if needed, or rely on console.
            // The existing error message display logic can be kept if a prominent UI warning is desired.
            const body = document.querySelector('body');
            if (body) {
                const errorDiv = document.createElement('div');
                errorDiv.style.cssText = "background-color: #fff3cd; color: #856404; border: 1px solid #ffeeba; padding: 10px; text-align: center; position: fixed; top: 60px; left: 0; right: 0; z-index: 1000;";
                errorDiv.innerHTML = `
                    <p><strong>Aviso:</strong> Algumas funcionalidades online (como salvar dados e insights com IA) estão desabilitadas.
                    A configuração do servidor e banco de dados ainda está em desenvolvimento.</p>`;
                
                // Make error message dismissable
                const dismissButton = document.createElement('button');
                dismissButton.textContent = 'OK';
                dismissButton.style.cssText = "margin-left: 15px; padding: 2px 8px; background-color: #856404; color: white; border: none; border-radius: 3px; cursor: pointer;";
                dismissButton.onclick = () => errorDiv.remove();
                errorDiv.appendChild(dismissButton);
                
                // Insert it after the header
                const header = document.querySelector('header');
                if (header) {
                    header.insertAdjacentElement('afterend', errorDiv);
                } else {
                    body.prepend(errorDiv);
                }
                 // Automatically remove after some time if not dismissed
                setTimeout(() => {
                    if (errorDiv.parentNode) {
                        errorDiv.remove();
                    }
                }, 15000); // 15 seconds
            }
        }
    } catch (e) {
        console.error("Erro crítico durante a inicialização da página:", e);
        initTheme(); // Ensure theme is set
        // Attempt to initialize App for basic UI even in critical failure
        try {
            App.init(); 
        } catch (appInitError) {
            console.error("Falha ao inicializar App no modo de recuperação:", appInitError);
        }
        
        const initialPageEl = document.getElementById('initial-page');
        if(initialPageEl) initialPageEl.classList.add('active'); // Show a default page

        const body = document.querySelector('body');
        if (body) {
            const criticalErrorDiv = document.createElement('div');
            criticalErrorDiv.innerHTML = `
                <p style="color: red; text-align: center; padding: 20px; font-size: 1.2em; background-color: #f8d7da; border: 1px solid #f5c6cb;">
                    <strong>Erro Crítico ao Carregar a Aplicação.</strong> Funcionalidade limitada.
                </p>`;
            body.prepend(criticalErrorDiv);
        }
    }
});
