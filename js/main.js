import { 
    db as firestoreDB, 
    auth as firebaseAuth, 
    getCurrentUserId, 
    app as firebaseApp, 
    authReadyPromise, // Import the promise
    // START: Importação para criação de usuário
    // Adicione as duas funções abaixo para criar e atualizar o usuário
    signInWithEmailAndPassword, 
    updateProfile 
    // END: Importação para criação de usuário
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


// START: Função para criar usuário gestor padrão
// Esta função cria o usuário gestor se ele não existir.
async function setupDefaultManagerUser(auth) {
    if (!auth) {
        console.warn("Setup Gestor: Serviço de autenticação não disponível.");
        return;
    }

    const email = "gestor@ufba.br";
    const password = "senha123";
    const displayName = "Lucas";

    try {
        // Tenta fazer o login primeiro para não recriar a senha ou gerar erro.
        // Se o login funcionar, o usuário já existe.
        await signInWithEmailAndPassword(auth, email, password);
        console.log(`Usuário gestor (${email}) já existe e o login foi verificado.`);
    } catch (loginError) {
        // Se o erro for 'auth/invalid-credential', significa que o usuário não existe ou a senha está errada.
        // Para este script, assumimos que se o login falhar, devemos tentar criar.
        if (loginError.code === 'auth/invalid-credential' || loginError.code === 'auth/user-not-found') {
            console.log(`Usuário gestor (${email}) não encontrado. Tentando criar...`);
            try {
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                console.log("Usuário gestor criado com sucesso:", userCredential.user.uid);
                
                await updateProfile(userCredential.user, {
                    displayName: displayName
                });
                console.log("Perfil do gestor atualizado com o nome:", displayName);
            } catch (creationError) {
                 // Caso o e-mail exista, mas a senha no script seja diferente da do Firebase
                if (creationError.code === 'auth/email-already-in-use') {
                    console.warn(`O email do gestor (${email}) já existe, mas a senha no script está incorreta. Nenhuma ação será tomada.`);
                } else {
                    console.error("Erro aninhado ao criar usuário gestor:", creationError);
                }
            }
        } else {
             console.error("Erro inesperado ao verificar o login do gestor:", loginError);
        }
    }
}
// END: Função para criar usuário gestor padrão


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
        
        // START: Chamada da função para criar usuário
        // Executa a função de setup após a autenticação estar pronta
        await setupDefaultManagerUser(firebaseAuth);
        // END: Chamada da função para criar usuário

        if (firebaseApp) { 
            App.init();
        } else {
            console.error("Instância do Firebase App não foi criada ou falhou. App não pode iniciar completamente com funcionalidades Firebase.");
            App.init(); 

            initTheme(); 
            
            const body = document.querySelector('body');
            if (body) {
                const errorDiv = document.createElement('div');
                errorDiv.style.cssText = "background-color: #fff3cd; color: #856404; border: 1px solid #ffeeba; padding: 10px; text-align: center; position: fixed; top: 60px; left: 0; right: 0; z-index: 1000;";
                errorDiv.innerHTML = `
                    <p><strong>Aviso:</strong> Algumas funcionalidades online (como salvar dados e insights com IA) estão desabilitadas.
                    A configuração do servidor e banco de dados ainda está em desenvolvimento.</p>`;
                
                const dismissButton = document.createElement('button');
                dismissButton.textContent = 'OK';
                dismissButton.style.cssText = "margin-left: 15px; padding: 2px 8px; background-color: #856404; color: white; border: none; border-radius: 3px; cursor: pointer;";
                dismissButton.onclick = () => errorDiv.remove();
                errorDiv.appendChild(dismissButton);
                
                const header = document.querySelector('header');
                if (header) {
                    header.insertAdjacentElement('afterend', errorDiv);
                } else {
                    body.prepend(errorDiv);
                }
                setTimeout(() => {
                    if (errorDiv.parentNode) {
                        errorDiv.remove();
                    }
                }, 15000); 
            }
        }
    } catch (e) {
        console.error("Erro crítico durante a inicialização da página:", e);
        initTheme(); 
        try {
            App.init(); 
        } catch (appInitError) {
            console.error("Falha ao inicializar App no modo de recuperação:", appInitError);
        }
        
        const initialPageEl = document.getElementById('initial-page');
        if(initialPageEl) initialPageEl.classList.add('active'); 

        const body = document.querySelector('body');
        if (body) {
            const criticalErrorDiv = document.createElement('div');
            criticalErrorDiv.innerHTML = `
                <p style="color: red; text-align: