export const appId = typeof __app_id !== 'undefined' ? __app_id : 'water-quality-app-v8';

// Attempt to get Firebase config from an injected global variable __firebase_config (expected to be a JSON string)
const rawFirebaseConfigString = typeof __firebase_config !== 'undefined' ? __firebase_config : '{}';

export let firebaseConfig;
try {
    firebaseConfig = JSON.parse(rawFirebaseConfigString);
    // If parsing results in an empty object or essential keys are missing, use a default placeholder.
    // Specifically check for apiKey as a primary indicator.
    if (Object.keys(firebaseConfig).length === 0 || !firebaseConfig.apiKey) {
        if (rawFirebaseConfigString !== '{}' && rawFirebaseConfigString !== '') { // Log if __firebase_config was provided but invalid
             console.warn("Conteúdo de __firebase_config inválido ou não contém apiKey. Usando placeholder.");
        } else {
             console.warn("Configuração do Firebase (__firebase_config) não fornecida ou vazia. Usando placeholder. Firestore não funcionará.");
        }
        firebaseConfig = { apiKey: "", authDomain: "placeholder.firebaseapp.com", projectId: "placeholder-project" };
    }
} catch (e) {
    console.error("Erro ao parsear __firebase_config JSON:", e, ". Usando placeholder.");
    firebaseConfig = { apiKey: "", authDomain: "placeholder.firebaseapp.com", projectId: "placeholder-project" };
}

export const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Attempt to get Gemini API Key from an injected global variable __gemini_api_key
export const geminiApiKey = typeof __gemini_api_key !== 'undefined' ? __gemini_api_key : ""; 
if (geminiApiKey === "" && typeof __gemini_api_key === 'undefined') { // Only log if __gemini_api_key was truly not defined
    console.warn("Chave da API Gemini (__gemini_api_key) não fornecida. Funcionalidades de IA estarão desabilitadas.");
}


export const universities = [
    { id: 'ufba', name: 'Universidade Federal da Bahia (UFBA)', institutes: ['ic_ufba'], logo: 'https://ava.ufba.br/pluginfile.php/3/theme_adaptable/logo/1745856514/logo_ufba.png' }
];

export const allInstitutesSectors = [
    { id: 'ic_ufba', name: 'Instituto de Computação (IC) - UFBA', universityId: 'ufba', universityName: 'UFBA', logo: 'https://computacao.ufba.br/sites/computacao.ufba.br/files/ic_logo_padrao_0.png',
      locations: [
        { id: 'ic_bebedouro_1', name: 'Bebedouro Corredor Principal', type: 'Bebedouro', lastAnalysis: '01/07/2025', lastCleaning: '25/06/2025', chlorine: 0.5, fecalColiforms: 0, turbidity: 0.8, pH: 7.2, status: 'good' },
        { id: 'ic_torneira_copa', name: 'Torneira da Copa', type: 'Torneira', lastAnalysis: '01/07/2025', lastCleaning: '20/06/2025', chlorine: 0.3, fecalColiforms: 5, turbidity: 1.5, pH: 6.8, status: 'attention' },
        { id: 'ic_bebedouro_2', name: 'Bebedouro Bloco A (Térreo)', type: 'Bebedouro', lastAnalysis: '28/06/2025', lastCleaning: '28/06/2025', chlorine: 0.6, fecalColiforms: 0, turbidity: 0.5, pH: 7.0, status: 'good' },
        { id: 'ic_torneira_lab', name: 'Torneira Laboratório X', type: 'Torneira', lastAnalysis: '29/06/2025', lastCleaning: '29/06/2025', chlorine: 0.2, fecalColiforms: 15, turbidity: 2.5, pH: 6.5, status: 'critical' },
        { id: 'ic_vaso_fem_1', name: 'Vaso Sanitário Feminino (1º Andar)', type: 'Vaso Sanitário', lastAnalysis: 'N/A', lastCleaning: '02/07/2025', chlorine: null, fecalColiforms: null, turbidity: null, pH: null, status: 'good' },
        { id: 'ic_bebedouro_3', name: 'Bebedouro Biblioteca', type: 'Bebedouro', lastAnalysis: '30/06/2025', lastCleaning: '20/06/2025', chlorine: 0.4, fecalColiforms: 2, turbidity: 1.1, pH: 7.1, status: 'attention' },
        { id: 'ic_torneira_jardim', name: 'Torneira Jardim Interno', type: 'Torneira', lastAnalysis: '25/06/2025', lastCleaning: '25/06/2025', chlorine: 0.7, fecalColiforms: 0, turbidity: 0.3, pH: 7.5, status: 'good' },
        { id: 'ic_vaso_masc_1', name: 'Vaso Sanitário Masculino (Térreo)', type: 'Vaso Sanitário', lastAnalysis: 'N/A', lastCleaning: '01/07/2025', chlorine: null, fecalColiforms: null, turbidity: null, pH: null, status: 'good' },
        { id: 'ic_bebedouro_prof', name: 'Bebedouro Sala dos Professores', type: 'Bebedouro', lastAnalysis: '02/07/2025', lastCleaning: '30/06/2025', chlorine: 0.5, fecalColiforms: 0, turbidity: 0.6, pH: 7.3, status: 'good' },
      ]
    }
];
