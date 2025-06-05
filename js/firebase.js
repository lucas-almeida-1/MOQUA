import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
    getAuth, 
    signInAnonymously, 
    signInWithCustomToken, 
    onAuthStateChanged,
    signInWithEmailAndPassword, 
    signOut,
    updateProfile // Para atualizar nome de exibição, se necessário no futuro
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
                console.log("[Firebase] Usuário conectado:", user.uid, user.email, user.displayName);
                currentUserId = user.uid;
                currentUserDetails = { // Guarda detalhes relevantes
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName 
                };
                
                // Atualiza o nome do gestor na UI se ele estiver na página do gestor
                if (window.App && window.App.currentPage === 'manager-dashboard-page') {
                    const managerName = currentUserDetails.displayName || (currentUserDetails.email ? currentUserDetails.email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : "Gestor");
                    const welcomeEl = document.getElementById('manager-welcome-name');
                    if (welcomeEl) welcomeEl.textContent = managerName;
                }

            } else {
                console.log("[Firebase] Nenhum usuário conectado. Tentando login anônimo/customizado.");
                currentUserId = null;
                currentUserDetails = null;
                if (initialAuthToken) {
                    try {
                        await signInWithCustomToken(auth, initialAuthToken);
                        currentUserId = auth.currentUser?.uid;
                        currentUserDetails = auth.currentUser ? { uid: auth.currentUser.uid, email: auth.currentUser.email, displayName: auth.currentUser.displayName } : null;
                    } catch (error) {
                        console.warn("Falha ao logar com token customizado, tentando anônimo:", error);
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
            }
            resolve(currentUserDetails); 
        });
    } catch (error) {
        console.error("Erro de inicialização do Firebase:", error);
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
    doc, setDoc, getDoc, // Firestore document operations
    signInWithEmailAndPassword, signOut, updateProfile // Auth operations
};