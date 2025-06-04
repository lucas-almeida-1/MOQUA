import { db, getCurrentUserId, collection, addDoc, serverTimestamp } from './firebase.js';
import { appId } from './config.js';
import { showErrorPopup, showNotificationModal } from './ui.js';

export function resetComplaintModal(appInstance) {
    const form = document.getElementById('complaint-form');
    if (form) form.reset();
    const fileList = document.getElementById('file-list');
    if (fileList) fileList.innerHTML = '';
    const identifyUserCheckbox = document.getElementById('identify-user');
    if (identifyUserCheckbox) identifyUserCheckbox.checked = false;
    const userIdentificationFields = document.getElementById('user-identification-fields');
    if (userIdentificationFields) userIdentificationFields.style.display = 'none';
}

export function handleFileSelect(event, appInstance) {
    const files = event.target.files;
    const fileListContainer = document.getElementById('file-list');
    if (!fileListContainer) return;
    fileListContainer.innerHTML = '';

    if (files.length > 0) {
        const list = document.createElement('ul');
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const li = document.createElement('li');
            const fileName = document.createTextNode(`${file.name} (${(file.size / 1024).toFixed(2)} KB) `);
            li.appendChild(fileName);
            const fileURL = URL.createObjectURL(file);
            const link = document.createElement('a');
            link.href = fileURL; link.textContent = "(Visualizar)"; link.target = "_blank";
            li.appendChild(link);
            list.appendChild(li);
        }
        fileListContainer.appendChild(list);
    }
}

export async function submitComplaint(event, appInstance) {
    event.preventDefault();
    const form = event.target;
    const type = form.elements['complaint-type'].value;
    const description = form.elements['description'].value.trim();
    const identify = form.elements['identify-user'].checked;
    const userName = form.elements['user-name'].value.trim();
    const userMatricula = form.elements['user-matricula'].value.trim();
    let isValid = true;

    document.querySelectorAll('.form-error-popup.show').forEach(el => el.classList.remove('show'));

    if (!type) {
        showErrorPopup('complaint-type', 'Selecione um local.', appInstance.errorPopupTimeouts);
        isValid = false;
    }
    if (!description) {
        showErrorPopup('description', 'Preencha uma descrição com detalhes do problema.', appInstance.errorPopupTimeouts);
        isValid = false;
    }
    if (identify && !userName && !userMatricula) {
        showErrorPopup('user-identification', 'Preencha seu nome ou Matrícula/ID.', appInstance.errorPopupTimeouts);
        isValid = false;
    }

    if (!isValid) return;

    const complaintData = {
        instituteSectorId: appInstance.selectedInstituteSector.id,
        instituteSectorName: appInstance.selectedInstituteSector.name,
        locationType: type,
        description: description,
        identifyUser: identify,
        userName: identify ? userName : null,
        userMatricula: identify ? userMatricula : null,
        status: 'new',
        timestamp: serverTimestamp(),
        submittedBy: getCurrentUserId() || 'anonymous_user'
    };

    if (db && getCurrentUserId()) {
        try {
            await addDoc(collection(db, `/artifacts/${appId}/public/data/water_quality_complaints`), complaintData);
            showNotificationModal('Reclamação enviada com sucesso! Obrigado pela sua colaboração.', 'success');
            resetComplaintModal(appInstance);
            const complaintModal = document.getElementById('complaint-modal');
            if (complaintModal) complaintModal.style.display = 'none';
        } catch (e) {
            showNotificationModal('Erro ao enviar reclamação: ' + e.message, 'error');
        }
    } else {
        showNotificationModal('Reclamação registrada localmente. Finalizar configuração.', 'info');
        resetComplaintModal(appInstance);
        const complaintModal = document.getElementById('complaint-modal');
        if (complaintModal) complaintModal.style.display = 'none';
    }
}

export function setupComplaintFormEventListeners(appInstance) {
    const complaintForm = document.getElementById('complaint-form');
    if (complaintForm) complaintForm.addEventListener('submit', (e) => submitComplaint(e, appInstance));

    const attachmentInput = document.getElementById('attachment');
    if (attachmentInput) attachmentInput.addEventListener('change', (e) => handleFileSelect(e, appInstance));
    
    const fileArea = document.getElementById('file-drop-area');
    if (fileArea) {
        fileArea.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); fileArea.classList.add('border-blue-500', 'bg-blue-50', 'dark:border-blue-400', 'dark:bg-gray-700'); });
        fileArea.addEventListener('dragleave', (e) => { e.preventDefault(); e.stopPropagation(); fileArea.classList.remove('border-blue-500', 'bg-blue-50', 'dark:border-blue-400', 'dark:bg-gray-700'); });
        fileArea.addEventListener('drop', (e) => {
            e.preventDefault(); e.stopPropagation();
            fileArea.classList.remove('border-blue-500', 'bg-blue-50', 'dark:border-blue-400', 'dark:bg-gray-700');
            if (attachmentInput) attachmentInput.files = e.dataTransfer.files;
            handleFileSelect({target: { files: e.dataTransfer.files }}, appInstance);
        });
        fileArea.addEventListener('click', () => attachmentInput?.click());
    }

    const identifyUserCheckbox = document.getElementById('identify-user');
    const userIdentificationFields = document.getElementById('user-identification-fields');
    if (identifyUserCheckbox && userIdentificationFields) {
        identifyUserCheckbox.addEventListener('change', function(e) {
            userIdentificationFields.style.display = e.target.checked ? 'block' : 'none';
        });
    }
}