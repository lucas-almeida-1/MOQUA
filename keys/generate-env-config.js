const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const outputDir = path.resolve(projectRoot, 'js');
const outputFilePath = path.resolve(outputDir, 'env-config.js');

console.log('[generate-env-config] Iniciando a geração do arquivo de configuração do ambiente (modo de variáveis individuais)...');
console.log(`[generate-env-config] Diretório de saída: ${outputDir}`);
console.log(`[generate-env-config] Arquivo de saída: ${outputFilePath}`);

try {
    if (!fs.existsSync(outputDir)) {
        console.log(`[generate-env-config] Criando diretório de saída: ${outputDir}`);
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Lê as variáveis de ambiente individuais do Firebase e outras
    const firebaseValues = {
        apiKey: process.env.apiKey, // Nome exato da variável no Vercel
        authDomain: process.env.authDomain,
        projectId: process.env.projectId,
        storageBucket: process.env.storageBucket,
        messagingSenderId: process.env.messagingSenderId,
        appId: process.env.appId
        // measurementId: process.env.measurementId // Opcional, adicione se usar
    };

    const geminiApiKey = process.env.GEMINI_API_KEY; // Já estava funcionando, manter
    const globalAppId = process.env.APP_ID_GLOBAL; // Renomeado para evitar conflito com Firebase appId
    const initialAuthToken = process.env.INITIAL_AUTH_TOKEN;

    let outputContent = `// Arquivo gerado automaticamente por keys/generate-env-config.js em ${new Date().toISOString()}.\n`;
    outputContent += `// Contém configurações de ambiente lidas de variáveis individuais.\n\n`;

    // Verifica se todas as chaves essenciais do Firebase foram encontradas
    const essentialFirebaseKeys = ['apiKey', 'authDomain', 'projectId'];
    const missingKeys = essentialFirebaseKeys.filter(key => !firebaseValues[key]);

    if (missingKeys.length > 0) {
        console.warn(`\n[generate-env-config] AVISO: As seguintes chaves essenciais do Firebase não foram encontradas nas variáveis de ambiente: ${missingKeys.join(', ')}`);
        console.warn(`[generate-env-config] A aplicação tentará usar configurações de fallback de js/config.js, se existirem.\n`);
        outputContent += `console.warn('[env-config] Configuração do Firebase incompleta nas variáveis de ambiente. Usando fallback se disponível.');\n`;
        // Não define __firebase_config se chaves essenciais estiverem faltando
    } else {
        // Constrói o objeto firebaseConfig e o serializa para JSON
        const firebaseConfigObject = {};
        for (const key in firebaseValues) {
            if (firebaseValues[key] !== undefined) { // Inclui apenas chaves que foram definidas
                firebaseConfigObject[key] = firebaseValues[key];
            }
        }
        const firebaseConfigJsonString = JSON.stringify(firebaseConfigObject);
        outputContent += `console.log('[env-config] Definindo __firebase_config a partir de variáveis de ambiente individuais.');\n`;
        outputContent += `window.__firebase_config = '${firebaseConfigJsonString.replace(/'/g, "\\'")}';\n`;
    }

    if (geminiApiKey) {
        outputContent += `console.log('[env-config] Definindo __gemini_api_key a partir de variáveis de ambiente.');\n`;
        outputContent += `window.__gemini_api_key = '${geminiApiKey.replace(/'/g, "\\'")}';\n`;
    } else {
        console.warn(`\n[generate-env-config] AVISO: Variável de ambiente GEMINI_API_KEY não encontrada.\n`);
        outputContent += `console.warn('[env-config] __gemini_api_key não encontrado. Funcionalidades de IA podem não funcionar.');\n`;
    }
    
    if (globalAppId) { // Usando APP_ID_GLOBAL para evitar conflito com firebaseValues.appId
        outputContent += `console.log('[env-config] Definindo __app_id (global) a partir de variáveis de ambiente.');\n`;
        outputContent += `window.__app_id = '${globalAppId.replace(/'/g, "\\'")}';\n`;
    } else {
        outputContent += `console.log('[env-config] __app_id (global) não encontrado. Usando fallback de config.js.');\n`;
    }

    if (initialAuthToken) {
        outputContent += `console.log('[env-config] Definindo __initial_auth_token a partir de variáveis de ambiente.');\n`;
        outputContent += `window.__initial_auth_token = '${initialAuthToken.replace(/'/g, "\\'")}';\n`;
    } else {
        outputContent += `console.log('[env-config] __initial_auth_token não encontrado. Usando fallback se aplicável.');\n`;
    }

    fs.writeFileSync(outputFilePath, outputContent);
    console.log(`\n[generate-env-config] js/env-config.js gerado com sucesso em ${outputFilePath}\n`);

} catch (error) {
    console.error(`\n[generate-env-config] ERRO CRÍTICO ao tentar gerar js/env-config.js:`, error);
    const fallbackContent = `// Erro crítico ao gerar env-config.js.\n` +
                          `console.error("[env-config] Falha crítica na geração de env-config.js durante o build.");\n`;
    try {
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        fs.writeFileSync(outputFilePath, fallbackContent);
        console.log(`[generate-env-config] Um arquivo js/env-config.js de fallback foi criado devido ao erro.`);
    } catch (fallbackError) {
        console.error(`[generate-env-config] Falha ao criar até mesmo o arquivo de fallback js/env-config.js:`, fallbackError);
    }
}