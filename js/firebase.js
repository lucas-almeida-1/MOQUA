import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp, setLogLevel } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { firebaseConfig, initialAuthToken } from './config.js';

let app = null; // Initialize to null
let db = null;
let auth = null;
let currentUserId = null;

// Promise to signal auth readiness
export const authReadyPromise = new Promise((resolve) => {
    // Check for placeholder config: missing apiKey, empty apiKey, or known placeholder pattern.
    if (!firebaseConfig || !firebaseConfig.apiKey || firebaseConfig.apiKey === "" || firebaseConfig.apiKey.includes("AIzaSyCXXXXXX")) {
        console.warn("Firebase config is a placeholder, missing/empty apiKey, or invalid. Firebase will not be initialized. App will run with local/mocked data if available, or Firebase-dependent features will be disabled.");
        // app, db, auth remain null
        resolve(null); // Resolve immediately, App.init in main.js will see firebaseApp as null
        return;
    }

    try {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        // setLogLevel('debug'); // Uncomment for debugging

        onAuthStateChanged(auth, async (user) => {
            if (user) {
                currentUserId = user.uid;
            } else {
                if (initialAuthToken) {
                    try {
                        await signInWithCustomToken(auth, initialAuthToken);
                        currentUserId = auth.currentUser?.uid;
                    } catch (error) {
                        console.warn("Failed to sign in with custom token, falling back to anonymous sign-in:", error);
                        await signInAnonymously(auth);
                        currentUserId = auth.currentUser?.uid;
                    }
                } else {
                    await signInAnonymously(auth);
                    currentUserId = auth.currentUser?.uid;
                }
            }
            resolve(currentUserId); // Resolve the promise once auth state is known
        });
    } catch (error) {
        console.error("Erro de inicialização do Firebase (config seemed valid but failed):", error);
        app = null; // Ensure app, db, auth are null if init fails
        db = null;
        auth = null;
        currentUserId = null;
        resolve(null); // Resolve with null if Firebase init fails
    }
});

export { db, auth, app };
export function getCurrentUserId() { return currentUserId; }
export { collection, addDoc, serverTimestamp }; // Export Firestore functions for direct use
