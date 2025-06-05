const fs = require('fs');
const path = require('path');

// __dirname aqui será /MOQUA/keys (ou onde quer que o script esteja no servidor de build)
// Precisamos subir um nível para a raiz do projeto e então entrar em 'js'
const projectRoot = path.resolve(__dirname, '..'); 
const outputDir = path.resolve(projectRoot, 'js');
const outputFilePath = path.resolve(outputDir, 'env-config.js');

console.log('[generate-env-config] Iniciando a geração do arquivo de configuração do ambiente...');
console.log(`[generate-env-config] Diretório de saída definido para: ${outputDir}`);
console.log(`[generate-env-config] Arquivo de saída definido para: ${outputFilePath}`);

try {
    // Garante que o diretório de saída exista
    if (!fs.existsSync(outputDir)) {
        console.log(`[generate-env-config] Criando diretório de saída: ${outputDir}`);
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Lê as variáveis de ambiente fornecidas pela plataforma de deploy (ex: Vercel)
    const firebaseConfigJson = process.env.FIREBASE_CONFIG_JSON;
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const appId = process.env.APP_ID; // Opcional, se você configurar
    const initialAuthToken = process.env.INITIAL_AUTH_TOKEN; // Opcional, se você configurar

    let outputContent = `// Este arquivo é gerado automaticamente por keys/generate-env-config.js em ${new Date().toISOString()}.\n`;
    outputContent += `// NÃO EDITE MANUALMENTE! Ele lê valores das variáveis de ambiente do servidor de build.\n\n`;

    if (firebaseConfigJson) {
        try {
            // Valida se FIREBASE_CONFIG_JSON é um JSON parseável e não vazio
            const parsedConfig = JSON.parse(firebaseConfigJson);
            if (Object.keys(parsedConfig).length === 0) {
                throw new Error("FIREBASE_CONFIG_JSON parseado é um objeto vazio.");
            }
            // Escapa aspas simples dentro da string JSON para que ela seja uma string JavaScript válida
            outputContent += `console.log('[env-config] Definindo __firebase_config a partir de variáveis de ambiente.');\n`;
            outputContent += `window.__firebase_config = '${firebaseConfigJson.replace(/'/g, "\\'")}';\n`;
        } catch (e) {
            console.error(`\n[generate-env-config] ERRO: FIREBASE_CONFIG_JSON fornecido não é um JSON válido ou está vazio.`);
            console.error(`[generate-env-config] Valor recebido: ${firebaseConfigJson}`);
            console.error(`[generate-env-config] Detalhes do erro: ${e.message}`);
            console.error(`[generate-env-config] Verifique se a variável de ambiente no Vercel (ou outra plataforma) está correta (ex: '{"apiKey":"...", ...}').`);
            console.error(`[generate-env-config] O arquivo js/env-config.js não conterá __firebase_config se não for válido, e a aplicação usará o fallback de config.js.\n`);
            outputContent += `console.warn('[env-config] __firebase_config não pôde ser definido a partir das variáveis de ambiente devido a um erro de parsing. Usando fallback se disponível.');\n`;
        }
    } else {
        console.warn(`\n[generate-env-config] AVISO: Variável de ambiente FIREBASE_CONFIG_JSON não encontrada.`);
        console.warn(`[generate-env-config] A aplicação tentará usar configurações de fallback de js/config.js, se existirem.\n`);
        outputContent += `console.warn('[env-config] __firebase_config não encontrado nas variáveis de ambiente. Usando fallback se disponível.');\n`;
    }

    if (geminiApiKey) {
        outputContent += `console.log('[env-config] Definindo __gemini_api_key a partir de variáveis de ambiente.');\n`;
        outputContent += `window.__gemini_api_key = '${geminiApiKey.replace(/'/g, "\\'")}';\n`;
    } else {
        console.warn(`\n[generate-env-config] AVISO: Variável de ambiente GEMINI_API_KEY não encontrada.`);
        console.warn(`[generate-env-config] As funcionalidades de IA do Gemini podem não funcionar.\n`);
        outputContent += `console.warn('[env-config] __gemini_api_key não encontrado nas variáveis de ambiente. Usando fallback se disponível.');\n`;
    }
    
    if (appId) {
        outputContent += `console.log('[env-config] Definindo __app_id a partir de variáveis de ambiente.');\n`;
        outputContent += `window.__app_id = '${appId.replace(/'/g, "\\'")}';\n`;
    } else {
        // Não é um aviso crítico se não estiver definido, pois config.js tem um fallback
        outputContent += `console.log('[env-config] __app_id não encontrado nas variáveis de ambiente. Usando fallback de config.js.');\n`;
    }

    if (initialAuthToken) {
        outputContent += `console.log('[env-config] Definindo __initial_auth_token a partir de variáveis de ambiente.');\n`;
        outputContent += `window.__initial_auth_token = '${initialAuthToken.replace(/'/g, "\\'")}';\n`;
    } else {
        outputContent += `console.log('[env-config] __initial_auth_token não encontrado nas variáveis de ambiente. A autenticação anônima/customizada pode usar fallbacks.');\n`;
    }

    fs.writeFileSync(outputFilePath, outputContent);
    console.log(`\n[generate-env-config] js/env-config.js gerado com sucesso em ${outputFilePath}\n`);

} catch (error) {
    console.error(`\n[generate-env-config] ERRO CRÍTICO ao tentar gerar js/env-config.js:`, error);
    // Cria um arquivo de fallback mínimo para evitar erros de importação quebrados
    const fallbackContent = `// Erro crítico ao gerar env-config.js. A aplicação usará configurações de fallback de config.js.\n` +
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