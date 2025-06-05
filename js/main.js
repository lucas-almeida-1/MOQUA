import { 
    db as firestoreDB, 
    auth as firebaseAuth, 
    getCurrentUserId, 
    app as firebaseApp, 
    authReadyPromise,
    signInWithEmailAndPassword, 
    updateProfile,
    // NOVO: Importe 'doc' e 'setDoc' para interagir com o Firestore
    doc,
    setDoc
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
import { appId } from './config.js'; // NOVO: Importe o appId para usar nos caminhos do Firestore


// FUNÇÃO ATUALIZADA: Agora também cria o documento no Firestore
async function setupDefaultManagerUser(auth, db) {
    if (!auth || !db) {
        console.warn("Setup Gestor: Serviço de autenticação ou Firestore não disponível.");
        return;
    }

    const email = "gestor@ufba.br";
    const password = "senha123";
    const displayName = "Lucas";

    try {
        await signInWithEmailAndPassword(auth, email, password);
        console.log(`Usuário gestor (${email}) já existe e o login foi verificado.`);
    } catch (loginError) {
        if (loginError.code === 'auth/invalid-credential' || loginError.code === 'auth/user-not-found') {
            console.log(`Usuário gestor (${email}) não encontrado. Tentando criar...`);
            try {
                // 1. Cria o usuário na Autenticação
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;
                console.log("Usuário gestor criado na Autenticação:", user.uid);
                
                // 2. Atualiza o perfil na Autenticação (com o nome)
                await updateProfile(user, {
                    displayName: displayName
                });
                console.log("Perfil do gestor atualizado com o nome:", displayName);

                // 3. NOVO: Cria o documento do usuário no Firestore
                const userDocRef = doc(db, `artifacts/${appId}/users/${user.uid}`);
                await setDoc(userDocRef, {
                    email: user.email,
                    displayName: user.displayName,
                    role: 'manager',
                    createdAt: new Date() // Usamos new Date() para simplicidade
                });
                console.log("Documento do gestor criado no Firestore com sucesso!");

            } catch (creationError) {
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

};

window.addEventListener('DOMContentLoaded', async () => {
    try {
        await authReadyPromise; 
        
        // ATUALIZADO: Passa o 'firestoreDB' para a função
        await setupDefaultManagerUser(firebaseAuth, firestoreDB);

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
                <p style="color: red; text-align: center; padding: 20px; font-size: 1.2em; background-color: #f8d7da; border: 1px solid #f5c6cb;">
                    <strong>Erro Crítico ao Carregar a Aplicação.</strong> Funcionalidade limitada.
                </p>`;
            body.prepend(criticalErrorDiv);
        }
    }
});