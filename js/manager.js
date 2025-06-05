import { showPage, showErrorPopup, showNotificationModal } from './ui.js';
import { geminiApiKey } from './config.js';
import { 
    auth, 
    signInWithEmailAndPassword, 
    signOut,
    db, 
    collection, 
    query, 
    orderBy, 
    onSnapshot,
    doc,    
    setDoc, 
    getDoc  
} from './firebase.js';
import { appId } from './config.js';

const { jsPDF } = window.jspdf; 
let complaintsUnsubscribe = null; 

export async function handleLogin(event, appInstance) {
    event.preventDefault();
    const form = event.target;
    const email = form.elements['email'].value.trim();
    const password = form.elements['password'].value;
    let isValid = true;

    document.querySelectorAll('#login-form .form-error-popup.show').forEach(el => el.classList.remove('show'));

    if (!email) {
        showErrorPopup('email-login', 'Preencha com um email cadastrado.', appInstance.errorPopupTimeouts);
        isValid = false;
    }
    if (!password) {
        showErrorPopup('password-login', 'Preencha o campo com a senha.', appInstance.errorPopupTimeouts);
        isValid = false;
    }
    
    if (!isValid) return;

    if (!auth) {
        showNotificationModal('Serviço de autenticação não está disponível. Verifique a conexão com o Firebase.', 'error');
        return;
    }

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("[Manager] Login bem-sucedido para:", user.email);
        
        // Atualiza o nome do gestor na UI (o onAuthStateChanged também fará isso, mas aqui garante imediatamente)
        const managerName = user.displayName || (user.email ? user.email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : "Gestor");
        const managerWelcomeNameEl = document.getElementById('manager-welcome-name');
        if (managerWelcomeNameEl) managerWelcomeNameEl.textContent = managerName;
        
        showNotificationModal('Login bem-sucedido! Redirecionando...', 'success');
        showPage('manager-dashboard-page', appInstance); // Chama showPage diretamente
    } catch (error) {
        console.error("[Manager] Erro no login:", error);
        let errorMessage = "Falha no login. Verifique suas credenciais.";
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            errorMessage = "Email ou senha inválidos.";
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = "O formato do email é inválido.";
        }
        showNotificationModal(errorMessage, 'error');
    }
}

export async function handleLogout(appInstance) {
    if (!auth) {
        showNotificationModal('Serviço de autenticação não disponível.', 'error');
        showPage('login-page', appInstance); 
        return;
    }
    try {
        await signOut(auth);
        console.log("[Manager] Logout bem-sucedido.");
        appInstance.lastAiAnalysisText = null; 
        showNotificationModal("Logout realizado com sucesso.", "info");
        stopListeningToComplaints(); 
        // A lógica em onAuthStateChanged (em firebase.js) deve redirecionar para 'login-page' se App.currentPage era 'manager-dashboard-page'
        // Mas podemos chamar explicitamente para garantir, ou deixar onAuthStateChanged cuidar.
        // Por segurança, chamaremos aqui também.
        showPage('login-page', appInstance); 
    } catch (error) {
        console.error("[Manager] Erro ao fazer logout:", error);
        showNotificationModal("Erro ao tentar fazer logout.", "error");
    }
}


export function renderManagerDashboard(appInstance) {
    const overviewContainer = document.getElementById('manager-realtime-data');
    if (!overviewContainer) {
        console.warn("[Manager] Elemento 'manager-realtime-data' não encontrado.");
        return;
    }
    overviewContainer.innerHTML = '';
    let criticalCount = 0;
    let attentionCount = 0;
    let goodCount = 0;

    const userDetails = appInstance.auth?.currentUser; // Pega o usuário logado diretamente do auth
    const managerName = userDetails?.displayName || (userDetails?.email ? userDetails.email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : "Gestor");
    const managerWelcomeNameEl = document.getElementById('manager-welcome-name');
    if (managerWelcomeNameEl) managerWelcomeNameEl.textContent = managerName;


    if (appInstance.selectedInstituteSector && appInstance.selectedInstituteSector.locations && appInstance.selectedInstituteSector.locations.length > 0) {
        appInstance.selectedInstituteSector.locations.forEach(loc => { 
            if (loc.status === 'critical') {
                overviewContainer.innerHTML += `<p class="text-red-600 dark:text-red-400">🔴 <strong>CRÍTICO:</strong> ${loc.name} (${loc.type})</p>`;
                criticalCount++;
            } else if (loc.status === 'attention') {
                overviewContainer.innerHTML += `<p class="text-yellow-600 dark:text-yellow-400">🟡 <strong>ATENÇÃO:</strong> ${loc.name} (${loc.type})</p>`;
                attentionCount++;
            } else {
                goodCount++;
            }
        });
        if (goodCount > 0 && (criticalCount > 0 || attentionCount > 0)) { 
             overviewContainer.innerHTML += `<p class="text-green-600 dark:text-green-400">✅ ${goodCount} outro(s) ponto(s) com qualidade BOA.</p>`;
        }
        if (criticalCount === 0 && attentionCount === 0 && goodCount === 0 && appInstance.selectedInstituteSector.locations.length === 0) {
             overviewContainer.innerHTML = '<p>Nenhum ponto de coleta cadastrado para este setor.</p>';
        } else if (criticalCount === 0 && attentionCount === 0 && goodCount > 0) {
             overviewContainer.innerHTML = `<p class="text-green-600 dark:text-green-400">✅ Todos os ${goodCount} ponto(s) de coleta estão com qualidade BOA.</p>`;
        } else if (criticalCount === 0 && attentionCount === 0 && goodCount === 0 && appInstance.selectedInstituteSector.locations.length > 0) { 
            overviewContainer.innerHTML = '<p>Nenhum dado de ponto de coleta para exibir com os filtros atuais.</p>';
        }
    } else {
        overviewContainer.innerHTML = '<p>Nenhum setor selecionado ou setor sem pontos de coleta cadastrados.</p>';
    }
    const aiResultDiv = document.getElementById('ai-analysis-result');
    if(aiResultDiv) aiResultDiv.innerHTML = ''; 
    
    // loadNotificationPreferences é chamado por showPage quando manager-dashboard-page é ativado
}

export async function loadNotificationPreferences(appInstance) {
    const userId = appInstance.currentUserId(); // Usa a função de getCurrentUserId do appInstance
    if (!userId || !db) {
        console.warn("[Manager] Não é possível carregar preferências: Usuário não logado ou DB não inicializado.");
        // Define um estado padrão para a UI se as preferências não puderem ser carregadas
        document.getElementById('sms-checkbox').checked = false;
        document.getElementById('sms-number').value = '';
        document.getElementById('email-checkbox').checked = false;
        document.getElementById('email-address').value = '';
        document.getElementById('whatsapp-checkbox').checked = false;
        document.getElementById('whatsapp-number').value = '';
        document.getElementById('whatsapp-autopopulate-sms').checked = false;
        appInstance.editingNotificationPrefs = false;
        updateNotificationInputsState(appInstance);
        return;
    }

    const prefsRef = doc(db, `/artifacts/${appId}/users/${userId}/manager_preferences/notifications`);
    try {
        const docSnap = await getDoc(prefsRef);
        if (docSnap.exists()) {
            const prefs = docSnap.data();
            document.getElementById('sms-checkbox').checked = prefs.smsEnabled || false;
            document.getElementById('sms-number').value = prefs.smsNumber || '';
            document.getElementById('email-checkbox').checked = prefs.emailEnabled || false;
            document.getElementById('email-address').value = prefs.emailAddress || '';
            document.getElementById('whatsapp-checkbox').checked = prefs.whatsappEnabled || false;
            document.getElementById('whatsapp-number').value = prefs.whatsappNumber || '';
            document.getElementById('whatsapp-autopopulate-sms').checked = prefs.whatsappAutopopulate || false;
            console.log("[Manager] Preferências de notificação carregadas.");
        } else {
            console.log("[Manager] Nenhuma preferência de notificação encontrada. Usando padrões.");
             document.getElementById('sms-checkbox').checked = false;
             document.getElementById('sms-number').value = '';
             document.getElementById('email-checkbox').checked = false;
             document.getElementById('email-address').value = '';
             document.getElementById('whatsapp-checkbox').checked = false;
             document.getElementById('whatsapp-number').value = '';
             document.getElementById('whatsapp-autopopulate-sms').checked = false;
        }
    } catch (error) {
        console.error("[Manager] Erro ao carregar preferências de notificação:", error);
    }
    appInstance.editingNotificationPrefs = false; 
    updateNotificationInputsState(appInstance); 
}

async function saveNotificationPreferences(appInstance) {
    const userId = appInstance.currentUserId();
    if (!userId || !db) {
        showNotificationModal("Não foi possível salvar as preferências. Usuário não autenticado ou falha na conexão.", "error");
        return;
    }

    const prefs = {
        smsEnabled: document.getElementById('sms-checkbox').checked,
        smsNumber: document.getElementById('sms-number').value,
        emailEnabled: document.getElementById('email-checkbox').checked,
        emailAddress: document.getElementById('email-address').value,
        whatsappEnabled: document.getElementById('whatsapp-checkbox').checked,
        whatsappNumber: document.getElementById('whatsapp-number').value,
        whatsappAutopopulate: document.getElementById('whatsapp-autopopulate-sms').checked,
        lastUpdated: serverTimestamp()
    };

    const prefsRef = doc(db, `/artifacts/${appId}/users/${userId}/manager_preferences/notifications`);
    try {
        await setDoc(prefsRef, prefs, { merge: true }); 
        showNotificationModal("Preferências de notificação salvas com sucesso!", "success");
    } catch (error) {
        console.error("[Manager] Erro ao salvar preferências de notificação:", error);
        showNotificationModal("Erro ao salvar preferências de notificação.", "error");
    }
}

export function loadAndDisplayComplaints(appInstance) {
    const loadingDiv = document.getElementById('complaints-loading');
    const listContainer = document.getElementById('complaints-list-container');
    const tableBody = document.getElementById('complaints-table-body');
    const noComplaintsMessage = document.getElementById('no-complaints-message');
    const complaintsTable = listContainer ? listContainer.querySelector('table') : null;

    if (!loadingDiv || !listContainer || !tableBody || !noComplaintsMessage || !complaintsTable) {
        console.error("Elementos da UI para reclamações não encontrados.");
        return;
    }

    loadingDiv.style.display = 'block';
    tableBody.innerHTML = ''; 
    complaintsTable.classList.add('hidden');
    noComplaintsMessage.classList.add('hidden');

    if (complaintsUnsubscribe) {
        complaintsUnsubscribe(); 
        console.log("[Manager] Listener de reclamações anterior cancelado.");
    }

    if (!db) {
        console.error("Firestore DB não inicializado.");
        loadingDiv.textContent = "Erro ao conectar com o banco de dados.";
        return;
    }

    const complaintsRef = collection(db, `/artifacts/${appId}/public/data/water_quality_complaints`);
    const q = query(complaintsRef, orderBy("timestamp", "desc")); 

    console.log(`[Manager] Escutando coleção: /artifacts/${appId}/public/data/water_quality_complaints`);

    complaintsUnsubscribe = onSnapshot(q, (querySnapshot) => {
        loadingDiv.style.display = 'none';
        tableBody.innerHTML = ''; 

        if (querySnapshot.empty) {
            complaintsTable.classList.add('hidden');
            noComplaintsMessage.classList.remove('hidden');
            console.log("[Manager] Nenhuma reclamação encontrada.");
        } else {
            complaintsTable.classList.remove('hidden');
            noComplaintsMessage.classList.add('hidden');
            querySnapshot.forEach((doc) => {
                const complaint = doc.data();
                const tr = document.createElement('tr');
                tr.classList.add('hover:bg-gray-50', 'dark:hover:bg-gray-700');

                const date = complaint.timestamp ? new Date(complaint.timestamp.seconds * 1000).toLocaleString('pt-BR') : 'N/A';
                const userIdentifier = complaint.identifyUser ? 
                    `${complaint.userName || ''} ${complaint.userMatricula ? '('+complaint.userMatricula+')' : ''}`.trim() 
                    : 'Anônimo';

                tr.innerHTML = `
                    <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">${date}</td>
                    <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">${complaint.instituteSectorName || 'N/A'}</td>
                    <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">${complaint.locationType || 'N/A'}</td>
                    <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-200 max-w-xs truncate" title="${complaint.description}">${complaint.description || 'N/A'}</td>
                    <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">${userIdentifier}</td>
                    <td class="px-4 py-3 whitespace-nowrap text-sm">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${complaint.status === 'new' ? 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100' : 
                            complaint.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100' :
                            complaint.status === 'resolved' ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-100'}">
                            ${complaint.status ? complaint.status.replace('_', ' ').toUpperCase() : 'N/A'}
                        </span>
                    </td>
                `;
                tableBody.appendChild(tr);
            });
            console.log(`[Manager] ${querySnapshot.size} reclamações carregadas e renderizadas.`);
        }
    }, (error) => {
        console.error("[Manager] Erro ao buscar reclamações: ", error);
        loadingDiv.textContent = "Erro ao carregar reclamações.";
        noComplaintsMessage.classList.remove('hidden');
        noComplaintsMessage.textContent = "Não foi possível carregar as reclamações.";
        complaintsTable.classList.add('hidden');
    });
}

export function stopListeningToComplaints() {
    if (complaintsUnsubscribe) {
        complaintsUnsubscribe();
        complaintsUnsubscribe = null; 
        console.log("[Manager] Listener de reclamações parado.");
    }
}

export function toggleEditNotificationPrefs(appInstance) {
    appInstance.editingNotificationPrefs = !appInstance.editingNotificationPrefs;
    const button = document.getElementById('edit-notification-prefs-btn');
    if (!button) return;

    if (appInstance.editingNotificationPrefs) {
        button.textContent = 'Salvar Preferências';
        button.classList.remove('bg-blue-500', 'hover:bg-blue-600', 'dark:bg-blue-600', 'dark:hover:bg-blue-700');
        button.classList.add('bg-green-500', 'hover:bg-green-600', 'dark:bg-green-600', 'dark:hover:bg-green-700');
    } else {
        button.textContent = 'Editar Preferências';
        button.classList.remove('bg-green-500', 'hover:bg-green-600', 'dark:bg-green-600', 'dark:hover:bg-green-700');
        button.classList.add('bg-blue-500', 'hover:bg-blue-600', 'dark:bg-blue-600', 'dark:hover:bg-blue-700');
        saveNotificationPreferences(appInstance); 
    }
    updateNotificationInputsState(appInstance);
}

export function updateNotificationInputsState(appInstance) {
    const isEditing = appInstance.editingNotificationPrefs;
    ['sms-checkbox', 'email-checkbox', 'whatsapp-checkbox',
     'sms-number', 'email-address', 'whatsapp-number',
     'whatsapp-autopopulate-sms'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = !isEditing;
    });
    handleNotificationInputChange(appInstance);
}

export function handleNotificationInputChange(appInstance) {
    const smsChecked = document.getElementById('sms-checkbox')?.checked;
    const emailChecked = document.getElementById('email-checkbox')?.checked;
    const whatsappChecked = document.getElementById('whatsapp-checkbox')?.checked;

    const smsContainer = document.getElementById('sms-number-container');
    const emailContainer = document.getElementById('email-address-container');
    const whatsappContainer = document.getElementById('whatsapp-number-container');
    const whatsappAutopopulateContainer = document.getElementById('whatsapp-autopopulate-container');

    if (smsContainer) smsContainer.style.display = smsChecked && appInstance.editingNotificationPrefs ? 'block' : 'none';
    if (emailContainer) emailContainer.style.display = emailChecked && appInstance.editingNotificationPrefs ? 'block' : 'none';
    if (whatsappContainer) whatsappContainer.style.display = whatsappChecked && appInstance.editingNotificationPrefs ? 'block' : 'none';
    if (whatsappAutopopulateContainer) whatsappAutopopulateContainer.style.display = whatsappChecked && smsChecked && appInstance.editingNotificationPrefs ? 'block' : 'none';

    if (!appInstance.editingNotificationPrefs) {
         if (!smsChecked && smsContainer) smsContainer.style.display = 'none';
         if (!emailChecked && emailContainer) emailContainer.style.display = 'none';
         if (!whatsappChecked) {
            if (whatsappContainer) whatsappContainer.style.display = 'none';
            if (whatsappAutopopulateContainer) whatsappAutopopulateContainer.style.display = 'none';
         }
    }
    handleWhatsappAutopopulate(appInstance);
}

export function handleWhatsappAutopopulate(appInstance) {
    const autopopulateCheckbox = document.getElementById('whatsapp-autopopulate-sms');
    const smsInput = document.getElementById('sms-number');
    const whatsappInput = document.getElementById('whatsapp-number');

    if (!autopopulateCheckbox || !smsInput || !whatsappInput) return;

    const autopopulate = autopopulateCheckbox.checked;
    if (autopopulate && smsInput.value) {
        whatsappInput.value = smsInput.value;
        whatsappInput.readOnly = true; // Mantém readOnly se autopopulado
    } else if (appInstance.editingNotificationPrefs) { // Só permite edição se não autopopulado E estiver editando
        whatsappInput.readOnly = false;
    } else { // Bloqueado se não estiver editando
        whatsappInput.readOnly = true;
    }
}

export async function analyzeSituationWithAI(appInstance, forceGeneration = false) {
    if (!appInstance.selectedInstituteSector || appInstance.selectedInstituteSector.locations.length === 0) {
        return null;
    }
    if (!forceGeneration && appInstance.lastAiAnalysisText) {
         const resultDiv = document.getElementById('ai-analysis-result');
         if (resultDiv) {
            let htmlResult = appInstance.lastAiAnalysisText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/^\* (.*$)/gm, '<li>$1</li>').replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>').replace(/\n/g, '<br>');
            resultDiv.innerHTML = `<h4 class="text-lg font-semibold mb-2 text-purple-700 dark:text-purple-300">Análise da IA (Existente):</h4><div class="prose dark:prose-invert max-w-none text-sm">${htmlResult}</div>`;
         }
        return appInstance.lastAiAnalysisText;
    }

    const resultDiv = document.getElementById('ai-analysis-result');
    const aiButton = document.getElementById('analyze-with-ai-btn');
    if (!resultDiv || !aiButton) return null;

    const originalButtonHTML = aiButton.innerHTML;
    aiButton.innerHTML = '<div class="loading-spinner !w-5 !h-5 !border-2 !inline-block !mr-2"></div>Processando dados...';
    aiButton.disabled = true;
    resultDiv.innerHTML = '<div class="loading-spinner"></div><p class="text-center dark:text-gray-300">Processando...</p>';
    
    if (!geminiApiKey) {
        console.error("Chave da API Gemini não configurada.");
        resultDiv.innerHTML = `<p class="text-red-500 dark:text-red-400">Erro: Chave da API Gemini não configurada.</p>`;
        aiButton.innerHTML = originalButtonHTML;
        aiButton.disabled = false;
        appInstance.lastAiAnalysisText = null;
        return null;
    }
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;
    let dataSummary = `Dados de qualidade da água para ${appInstance.selectedInstituteSector.name}:\n`;
    appInstance.selectedInstituteSector.locations.forEach(loc => {
        dataSummary += `- Local: ${loc.name} (${loc.type}), Status: ${loc.status}, Cloro: ${loc.chlorine ?? 'N/A'} mg/L, Coliformes Fecais: ${loc.fecalColiforms ?? 'N/A'} UFC/100mL, Turbidez: ${loc.turbidity ?? 'N/A'} NTU, pH: ${loc.pH ?? 'N/A'}\n`;
    });
    const prompt = `Você é um especialista em qualidade da água. Analise o seguinte resumo de dados de qualidade da água de um instituto universitário. Forneça uma breve análise da situação geral, destaque os pontos mais críticos ou que necessitam de atenção imediata, e sugira de 2 a 3 ações gerais ou recomendações que os gestores poderiam considerar. Seja conciso e direto ao ponto. Formate a resposta de forma clara, usando tópicos se apropriado. Dados:\n${dataSummary}`;
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    aiButton.innerHTML = '<div class="loading-spinner !w-5 !h-5 !border-2 !inline-block !mr-2"></div>Gerando análise...';
    resultDiv.innerHTML = '<div class="loading-spinner"></div><p class="text-center dark:text-gray-300">Gerando análise...</p>';
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }) });
        if (!response.ok) { const errorData = await response.json(); throw new Error(`API Error: ${response.status} ${errorData?.error?.message || ''}`); }
        const result = await response.json();
        if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
            const text = result.candidates[0].content.parts[0].text;
            appInstance.lastAiAnalysisText = text;
            let htmlResult = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/^\* (.*$)/gm, '<li>$1</li>').replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>').replace(/\n/g, '<br>');
            resultDiv.innerHTML = `<h4 class="text-lg font-semibold mb-2 text-purple-700 dark:text-purple-300">Análise da IA:</h4><div class="prose dark:prose-invert max-w-none text-sm">${htmlResult}</div>`;
            return text;
        } else { appInstance.lastAiAnalysisText = null; throw new Error("Resposta da API em formato inesperado."); }
    } catch (error) {
        appInstance.lastAiAnalysisText = null;
        resultDiv.innerHTML = `<p class="text-red-500 dark:text-red-400">Erro ao obter análise da IA: ${error.message}</p>`;
        return null;
    } finally {
        aiButton.innerHTML = originalButtonHTML;
        aiButton.disabled = false;
    }
}

export async function generateAndShowPdf(appInstance) {
    if (!appInstance.selectedInstituteSector) {
        showNotificationModal("Nenhum setor/instituto selecionado para gerar o relatório.", "error"); return;
    }
    
    const addAiAnalysisCheckbox = document.getElementById('add-ai-to-report-checkbox');
    let currentAiAnalysisText = appInstance.lastAiAnalysisText;

    if (addAiAnalysisCheckbox?.checked && !appInstance.lastAiAnalysisText) {
        currentAiAnalysisText = await analyzeSituationWithAI(appInstance, true);
        if (!currentAiAnalysisText) {
            showNotificationModal("Não foi possível gerar a análise de IA para o relatório. O PDF será gerado sem ela.", "error");
        }
    }

    const doc = new jsPDF();
    const institute = appInstance.selectedInstituteSector;
    let yPos = 20;
    const lineHeight = 6;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR')}`;
    
    doc.setFontSize(18);
    doc.text(`Relatório de Qualidade da Água`, margin, yPos);
    yPos += lineHeight * 2.5;
    doc.setFontSize(14);
    doc.text(`Setor/Instituto: ${institute.name}`, margin, yPos);
    yPos += lineHeight * 1.5;
    doc.text(`Última Atualização: ${formattedDate}`, margin, yPos);
    yPos += lineHeight * 2;

    if (addAiAnalysisCheckbox?.checked && currentAiAnalysisText) {
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text("Análise inicial com IA:", margin, yPos);
        yPos += lineHeight * 1.5;
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        const analysisLines = currentAiAnalysisText
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/^\* (.*$)/gm, '  - $1')
            .split('\n');
        analysisLines.forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine) {
                if (yPos > pageHeight - margin - lineHeight) { doc.addPage(); yPos = margin; }
                const splitText = doc.splitTextToSize(trimmedLine, doc.internal.pageSize.width - margin * 2);
                doc.text(splitText, margin, yPos);
                yPos += lineHeight * splitText.length;
            }
        });
        yPos += lineHeight * 1.5;
    }

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text("Detalhes dos Pontos de Coleta:", margin, yPos);
    yPos += lineHeight * 1.5;
    doc.setFontSize(10);
    
    institute.locations.forEach((loc, index) => {
        if (yPos > pageHeight - margin - (lineHeight * 6)) { doc.addPage(); yPos = margin; }
        doc.setFont(undefined, 'bold');
        doc.text(`${index + 1}. Local: ${loc.name} (${loc.type})`, margin, yPos);
        yPos += lineHeight;
        doc.setFont(undefined, 'normal');
        doc.text(`   Status: ${loc.status.toUpperCase()}`, margin, yPos);
        yPos += lineHeight;
        doc.text(`   Última Análise: ${loc.lastAnalysis} | Última Limpeza: ${loc.lastCleaning}`, margin, yPos);
        yPos += lineHeight;
        doc.text(`   Cloro: ${loc.chlorine ?? 'N/A'} mg/L | Col. Fecais: ${loc.fecalColiforms ?? 'N/A'} UFC/100mL`, margin, yPos);
        yPos += lineHeight;
        doc.text(`   Turbidez: ${loc.turbidity ?? 'N/A'} NTU | pH: ${loc.pH ?? 'N/A'}`, margin, yPos);
        yPos += lineHeight * 1.5;
    });

    appInstance.currentPdfDataUrl = doc.output('datauristring');
    const pdfPreviewIframe = document.getElementById('pdf-preview-iframe');
    const pdfPreviewModal = document.getElementById('pdf-preview-modal');

    if (pdfPreviewIframe && pdfPreviewModal) {
        pdfPreviewIframe.src = appInstance.currentPdfDataUrl;
        pdfPreviewModal.style.display = 'block';
    } else { console.error("Elementos do modal de pré-visualização de PDF não encontrados."); }
}

export function downloadPdf(appInstance) {
    if (appInstance.currentPdfDataUrl) {
        const periodEl = document.getElementById('report-period-pdf');
        const typeEl = document.getElementById('report-type-pdf');
        
        const periodValue = periodEl ? periodEl.value.toLowerCase().replace(/\s+/g, '_') : 'geral';
        const typeValue = typeEl ? typeEl.options[typeEl.selectedIndex].text.toLowerCase().replace(/\s+/g, '_') : 'completo';
        
        const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '_');
        const instituteIdStr = appInstance.selectedInstituteSector ? appInstance.selectedInstituteSector.id.replace(/[^a-z0-9]/gi, '_') : 'desconhecido';

        const fileName = `relatorio_qualidade_agua_${instituteIdStr}_${dateStr}_${periodValue}_${typeValue}.pdf`;
        
        const link = document.createElement('a');
        link.href = appInstance.currentPdfDataUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else { showNotificationModal("Nenhum PDF gerado para download.", "error"); }
}

export function setupManagerEventListeners(appInstance) {
    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.addEventListener('submit', (e) => handleLogin(e, appInstance));

    const editPrefsBtn = document.getElementById('edit-notification-prefs-btn');
    if (editPrefsBtn) editPrefsBtn.addEventListener('click', () => toggleEditNotificationPrefs(appInstance));

    ['sms-checkbox', 'email-checkbox', 'whatsapp-checkbox'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', () => handleNotificationInputChange(appInstance));
    });
    const autopopulateSms = document.getElementById('whatsapp-autopopulate-sms');
    if (autopopulateSms) autopopulateSms.addEventListener('change', () => handleWhatsappAutopopulate(appInstance));
    
    const analyzeBtn = document.getElementById('analyze-with-ai-btn');
    if (analyzeBtn) analyzeBtn.addEventListener('click', () => analyzeSituationWithAI(appInstance, true));

    const generatePdfBtn = document.getElementById('generate-pdf-btn');
    if (generatePdfBtn) generatePdfBtn.addEventListener('click', () => generateAndShowPdf(appInstance));

    const downloadPdfBtn = document.getElementById('download-pdf-btn');
    if (downloadPdfBtn) downloadPdfBtn.addEventListener('click', () => downloadPdf(appInstance));

    const managerLogoutBtn = document.getElementById('manager-logout-btn');
    if (managerLogoutBtn) managerLogoutBtn.addEventListener('click', () => handleLogout(appInstance)); 
}