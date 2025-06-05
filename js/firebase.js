import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
    getAuth, 
    signInAnonymously, 
    signInWithCustomToken, 
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut
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
    getDocs
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { firebaseConfig, initialAuthToken } from './config.js';

let app = null;
let db = null;
let auth = null;
let currentUserId = null;
let currentUserDetails = null; // Para guardar detalhes do usuário logado

export const authReadyPromise = new Promise((resolve) => {
    if (!firebaseConfig || !firebaseConfig.apiKey || firebaseConfig.apiKey === "" || firebaseConfig.apiKey.includes("AIzaSyCXXXXXX")) {
        console.warn("Firebase config é um placeholder ou inválido. Firebase não será inicializado.");
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
                console.log("[Firebase] Usuário conectado:", user.uid, user.email);
                currentUserId = user.uid;
                currentUserDetails = user; // Guarda o objeto user completo
                if (window.App && typeof window.App.showPage === 'function' && window.App.currentPage === 'login-page') {
                    // Se o usuário logou com sucesso e ainda está na página de login, redireciona
                    // Isso pode acontecer se a página for recarregada enquanto logado
                    const managerName = user.email ? user.email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : "Gestor";
                    const welcomeEl = document.getElementById('manager-welcome-name');
                    if (welcomeEl) welcomeEl.textContent = managerName;
                    window.App.showPage('manager-dashboard-page');
                }
            } else {
                console.log("[Firebase] Nenhum usuário conectado. Tentando login anônimo/customizado.");
                currentUserId = null;
                currentUserDetails = null;
                if (initialAuthToken) {
                    try {
                        await signInWithCustomToken(auth, initialAuthToken);
                        currentUserId = auth.currentUser?.uid;
                        currentUserDetails = auth.currentUser;
                    } catch (error) {
                        console.warn("Falha ao logar com token customizado, tentando anônimo:", error);
                        await signInAnonymously(auth);
                        currentUserId = auth.currentUser?.uid;
                        currentUserDetails = auth.currentUser;
                    }
                } else {
                    await signInAnonymously(auth);
                    currentUserId = auth.currentUser?.uid;
                    currentUserDetails = auth.currentUser;
                }
                 console.log("[Firebase] Usuário anônimo/customizado conectado:", currentUserId);
            }
            resolve(currentUserDetails); 
        });
    } catch (error) {
        console.error("Erro de inicialização do Firebase:", error);
        app = null; db = null; auth = null; currentUserId = null; currentUserDetails = null;
        resolve(null); 
    }
});

export { db, auth, app, firebaseConfig }; // Exportando firebaseConfig para debug
export function getCurrentUserId() { return currentUserId; }
export function getCurrentUserDetails() { return currentUserDetails; }

// Exportando todas as funções do Firestore e Auth
export { 
    collection, addDoc, serverTimestamp, 
    query, where, orderBy, onSnapshot, getDocs,
    signInWithEmailAndPassword, signOut
};