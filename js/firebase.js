import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
    getAuth, 
    signInAnonymously, 
    signInWithCustomToken, 
    onAuthStateChanged,
    signInWithEmailAndPassword, 
    signOut,
    updateProfile 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    serverTimestamp, 
    setLogLevel,
    query,  
    where,  
    orderBy, 
    onSnapshot, 
    getDocs,
    doc, 
    setDoc, 
    getDoc 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { firebaseConfig, initialAuthToken } from './config.js';

let app = null;
let db = null;
let auth = null;
let currentUserId = null;
let currentUserDetails = null; 

export const authReadyPromise = new Promise((resolve) => {
    if (!firebaseConfig || !firebaseConfig.apiKey || firebaseConfig.apiKey === "" || firebaseConfig.apiKey.includes("AIzaSyCXXXXXX")) {
        console.warn("[Firebase] Config é placeholder ou inválida. Firebase não será inicializado.");
        resolve(null); 
        return;
    }

    try {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        // setLogLevel('debug'); 

        onAuthStateChanged(auth, async (user) => {
            if (user) {
                console.log("[Firebase] onAuthStateChanged - Usuário conectado:", user.uid, "| Email:", user.email, "| Nome Exibição:", user.displayName);
                currentUserId = user.uid;
                currentUserDetails = { 
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName 
                };
                
                // Se o usuário está logado e já estamos na página do gestor
                // apenas garante que os dados do gestor (nome) e suas funcionalidades sejam carregados/atualizados.
                if (window.App && window.App.currentPage === 'manager-dashboard-page') {
                    console.log("[Firebase] onAuthStateChanged - Usuário já na página do gestor. Atualizando UI e dados.");
                    const managerName = currentUserDetails.displayName || (currentUserDetails.email ? currentUserDetails.email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : "Gestor");
                    const welcomeEl = document.getElementById('manager-welcome-name');
                    if (welcomeEl) welcomeEl.textContent = managerName;
                    
                    // Chama as funções de carregamento de dados do gestor, se elas existirem no App
                    window.App.renderManagerDashboard?.(); // A renderManagerDashboard já atualiza o nome também
                    window.App.loadNotificationPreferences?.();
                    window.App.loadAndDisplayComplaints?.();
                }
            } else {
                console.log("[Firebase] onAuthStateChanged - Nenhum usuário conectado. Tentando login anônimo/customizado.");
                currentUserId = null;
                currentUserDetails = null;
                if (initialAuthToken) {
                    try {
                        await signInWithCustomToken(auth, initialAuthToken);
                        currentUserId = auth.currentUser?.uid;
                        currentUserDetails = auth.currentUser ? { uid: auth.currentUser.uid, email: auth.currentUser.email, displayName: auth.currentUser.displayName } : null;
                    } catch (error) {
                        console.warn("[Firebase] Falha ao logar com token customizado, tentando anônimo:", error);
                        await signInAnonymously(auth);
                        currentUserId = auth.currentUser?.uid;
                        currentUserDetails = auth.currentUser ? { uid: auth.currentUser.uid, email: auth.currentUser.email, displayName: auth.currentUser.displayName } : null;
                    }
                } else {
                    await signInAnonymously(auth);
                    currentUserId = auth.currentUser?.uid;
                    currentUserDetails = auth.currentUser ? { uid: auth.currentUser.uid, email: auth.currentUser.email, displayName: auth.currentUser.displayName } : null;
                }
                console.log("[Firebase] Usuário anônimo/customizado conectado:", currentUserId);

                // Se o usuário deslogou e estava na página do gestor, redireciona para login
                if (window.App && window.App.currentPage === 'manager-dashboard-page') {
                    console.log("[Firebase] onAuthStateChanged - Usuário deslogou, redirecionando para login.");
                    window.App.showPage?.('login-page');
                }
            }
            resolve(currentUserDetails); 
        });
    } catch (error) {
        console.error("[Firebase] Erro de inicialização:", error);
        app = null; db = null; auth = null; currentUserId = null; currentUserDetails = null;
        resolve(null); 
    }
});

export { db, auth, app, firebaseConfig }; 
export function getCurrentUserId() { return currentUserId; }
export function getCurrentUserDetails() { return currentUserDetails; }

export { 
    collection, addDoc, serverTimestamp, 
    query, where, orderBy, onSnapshot, getDocs,
    doc, setDoc, getDoc, 
    signInWithEmailAndPassword, signOut, updateProfile 
};