// Tableau pour stocker les logs de l'application
let appLogs = [];
// Nombre maximum de logs à conserver
const MAX_LOG_HISTORY = 100;

// Type de logs
const LOG_TYPES = {
    INFO: 'info',      // Informations générales
    SUCCESS: 'success', // Opérations réussies
    WARNING: 'warning', // Avertissements
    ERROR: 'error',     // Erreurs
    API: 'api'         // Communications API (envoi/réception)
};

// Fonction pour ajouter un log à l'historique
function addLog(message, type = LOG_TYPES.INFO, details = null) {
    const timestamp = new Date().toLocaleString();
    const logEntry = {
        timestamp: timestamp,
        type: type,
        message: message,
        details: details
    };
    
    appLogs.unshift(logEntry); // Ajouter au début du tableau
    
    // Limiter la taille de l'historique
    if (appLogs.length > MAX_LOG_HISTORY) {
        appLogs.pop(); // Supprimer la plus ancienne entrée
    }
    
    // Sauvegarder l'historique dans localStorage
    localStorage.setItem('greenTrackLogs', JSON.stringify(appLogs));
    
    // Mettre à jour le compteur de logs dans le bouton
    updateLogButtonCount();
    
    // Si c'est une erreur, l'ajouter également à l'historique des erreurs
    if (type === LOG_TYPES.ERROR) {
        addErrorToHistory(message, details);
    }
}

// Mettre à jour le compteur de logs sur le bouton
function updateLogButtonCount() {
    const logBtn = document.getElementById('logsBtn');
    if (logBtn) {
        const count = appLogs.length;
        
        if (count > 0) {
            logBtn.querySelector('.log-count').textContent = count;
        }
    }
}

// Charger l'historique des logs depuis localStorage
function loadLogs() {
    const savedLogs = localStorage.getItem('greenTrackLogs');
    if (savedLogs) {
        try {
            appLogs = JSON.parse(savedLogs);
            updateLogButtonCount();
        } catch (e) {
            console.error('Erreur lors du chargement des logs:', e);
            appLogs = [];
        }
    }
}

// Afficher la modal des logs
function showLogsModal() {
    // Créer la modal si elle n'existe pas
    let modal = document.getElementById('logsModal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'logsModal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden';
        
        const modalContent = `
            <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
                <div class="p-4 border-b border-gray-200 flex justify-between items-center bg-green-50 rounded-t-lg">
                    <h3 class="text-lg font-semibold text-green-700">Journal d'activité</h3>
                    <div class="flex space-x-2">
                        <select id="logFilterType" class="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500">
                            <option value="all">Tous les logs</option>
                            <option value="${LOG_TYPES.INFO}">Info</option>
                            <option value="${LOG_TYPES.SUCCESS}">Succès</option>
                            <option value="${LOG_TYPES.WARNING}">Avertissement</option>
                            <option value="${LOG_TYPES.ERROR}">Erreur</option>
                            <option value="${LOG_TYPES.API}">API</option>
                        </select>
                        <button id="closeLogsModal" class="text-gray-500 hover:text-gray-700">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <div id="logsContent" class="p-4 overflow-auto flex-grow">
                    <p class="text-gray-500 text-center">Aucun log enregistré</p>
                </div>
                <div class="p-4 border-t border-gray-200 flex justify-between">
                    <button id="clearLogs" class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500">
                        Effacer les logs
                    </button>
                    <button id="exportLogs" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 mx-2">
                        <i class="fas fa-download mr-1"></i> Exporter
                    </button>
                    <button id="closeLogsModalBtn" class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400">
                        Fermer
                    </button>
                </div>
            </div>
        `;
        
        modal.innerHTML = modalContent;
        document.body.appendChild(modal);
        
        // Ajouter les événements
        document.getElementById('closeLogsModal').addEventListener('click', () => {
            modal.classList.add('hidden');
        });
        
        document.getElementById('closeLogsModalBtn').addEventListener('click', () => {
            modal.classList.add('hidden');
        });
        
        document.getElementById('clearLogs').addEventListener('click', () => {
            appLogs = [];
            localStorage.removeItem('greenTrackLogs');
            updateLogsContent();
            updateLogButtonCount();
        });
        
        document.getElementById('exportLogs').addEventListener('click', () => {
            exportLogsToJSON();
        });
        
        document.getElementById('logFilterType').addEventListener('change', (e) => {
            updateLogsContent(e.target.value);
        });
    }
    
    // Mettre à jour le contenu de la modal
    updateLogsContent();
    
    // Afficher la modal avec animation
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.querySelector('.bg-white').classList.add('animate-scale-in');
    }, 10);
}

// Mettre à jour le contenu de la modal avec les logs
function updateLogsContent(filterType = 'all') {
    const contentDiv = document.getElementById('logsContent');
    
    if (appLogs.length === 0) {
        contentDiv.innerHTML = '<p class="text-gray-500 text-center">Aucun log enregistré</p>';
        return;
    }
    
    let filteredLogs = appLogs;
    if (filterType !== 'all') {
        filteredLogs = appLogs.filter(log => log.type === filterType);
    }
    
    if (filteredLogs.length === 0) {
        contentDiv.innerHTML = '<p class="text-gray-500 text-center">Aucun log de ce type</p>';
        return;
    }
    
    let htmlContent = '<div class="space-y-3">';
    
    filteredLogs.forEach(log => {
        let bgColor, textColor, icon;
        
        switch(log.type) {
            case LOG_TYPES.SUCCESS:
                bgColor = 'bg-green-50';
                textColor = 'text-green-700';
                icon = 'fa-check-circle';
                break;
            case LOG_TYPES.WARNING:
                bgColor = 'bg-yellow-50';
                textColor = 'text-yellow-700';
                icon = 'fa-exclamation-triangle';
                break;
            case LOG_TYPES.ERROR:
                bgColor = 'bg-red-50';
                textColor = 'text-red-700';
                icon = 'fa-times-circle';
                break;
            case LOG_TYPES.API:
                bgColor = 'bg-purple-50';
                textColor = 'text-purple-700';
                icon = 'fa-server';
                break;
            default: // INFO
                bgColor = 'bg-blue-50';
                textColor = 'text-blue-700';
                icon = 'fa-info-circle';
        }
        
        htmlContent += `
            <div class="${bgColor} p-3 rounded border border-opacity-50 ${textColor.replace('text', 'border')} shadow-sm animate-log-appear">
                <div class="flex justify-between items-start">
                    <span class="${textColor} font-medium flex items-center">
                        <i class="fas ${icon} mr-2"></i>
                        ${log.message}
                    </span>
                    <span class="text-gray-500 text-sm">${log.timestamp}</span>
                </div>
                ${log.details ? `<div class="mt-2 text-sm text-gray-600 break-words bg-white bg-opacity-50 p-2 rounded">${typeof log.details === 'object' ? JSON.stringify(log.details, null, 2) : log.details}</div>` : ''}
            </div>
        `;
    });
    
    htmlContent += '</div>';
    contentDiv.innerHTML = htmlContent;
}

// Exporter les logs au format JSON
function exportLogsToJSON() {
    const dataStr = JSON.stringify(appLogs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `greentrack-logs-${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// Fonction pour ajouter une erreur à l'historique
function addErrorToHistory(errorMessage, errorDetails = null) {
    const timestamp = new Date().toLocaleString();
    const errorEntry = {
        timestamp: timestamp,
        message: errorMessage,
        details: errorDetails
    };
    
    errorHistory.unshift(errorEntry); // Ajouter au début du tableau
    
    // Limiter la taille de l'historique
    if (errorHistory.length > MAX_ERROR_HISTORY) {
        errorHistory.pop(); // Supprimer la plus ancienne entrée
    }
    
    // Sauvegarder l'historique dans localStorage
    localStorage.setItem('greenTrackErrorHistory', JSON.stringify(errorHistory));
    
    // Mettre à jour le compteur d'erreurs dans le bouton
    updateErrorButtonCount();
}

// Mettre à jour le compteur d'erreurs sur le bouton
function updateErrorButtonCount() {
    const errorBtn = document.getElementById('errorHistoryBtn');
    if (errorBtn) {
        const count = errorHistory.length;
        
        if (count > 0) {
            errorBtn.querySelector('.error-count').textContent = count;
            errorBtn.classList.remove('hidden');
        } else {
            errorBtn.classList.add('hidden');
        }
    }
}

// Charger l'historique des erreurs depuis localStorage
function loadErrorHistory() {
    const savedHistory = localStorage.getItem('greenTrackErrorHistory');
    if (savedHistory) {
        try {
            errorHistory = JSON.parse(savedHistory);
            updateErrorButtonCount();
        } catch (e) {
            console.error('Erreur lors du chargement de l\'historique des erreurs:', e);
            errorHistory = [];
        }
    }
}

// Afficher la modal d'historique des erreurs
function showErrorHistoryModal() {
    // Créer la modal si elle n'existe pas
    let modal = document.getElementById('errorHistoryModal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'errorHistoryModal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden';
        
        const modalContent = `
            <div class="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col">
                <div class="p-4 border-b border-gray-200 flex justify-between items-center bg-red-50 rounded-t-lg">
                    <h3 class="text-lg font-semibold text-red-700">Historique des erreurs</h3>
                    <button id="closeErrorModal" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div id="errorHistoryContent" class="p-4 overflow-auto flex-grow">
                    <p class="text-gray-500 text-center">Aucune erreur enregistrée</p>
                </div>
                <div class="p-4 border-t border-gray-200 flex justify-between">
                    <button id="clearErrorHistory" class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500">
                        Effacer l'historique
                    </button>
                    <button id="closeErrorModalBtn" class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400">
                        Fermer
                    </button>
                </div>
            </div>
        `;
        
        modal.innerHTML = modalContent;
        document.body.appendChild(modal);
        
        // Ajouter les événements
        document.getElementById('closeErrorModal').addEventListener('click', () => {
            modal.classList.add('hidden');
        });
        
        document.getElementById('closeErrorModalBtn').addEventListener('click', () => {
            modal.classList.add('hidden');
        });
        
        document.getElementById('clearErrorHistory').addEventListener('click', () => {
            errorHistory = [];
            localStorage.removeItem('greenTrackErrorHistory');
            updateErrorHistoryContent();
            updateErrorButtonCount();
        });
    }
    
    // Mettre à jour le contenu de la modal
    updateErrorHistoryContent();
    
    // Afficher la modal
    modal.classList.remove('hidden');
}

// Mettre à jour le contenu de la modal avec l'historique des erreurs
function updateErrorHistoryContent() {
    const contentDiv = document.getElementById('errorHistoryContent');
    
    if (errorHistory.length === 0) {
        contentDiv.innerHTML = '<p class="text-gray-500 text-center">Aucune erreur enregistrée</p>';
        return;
    }
    
    let htmlContent = '<div class="space-y-4">';
    
    errorHistory.forEach(error => {
        htmlContent += `
            <div class="bg-red-50 p-3 rounded border border-red-200">
                <div class="flex justify-between">
                    <span class="text-red-700 font-medium">${error.message}</span>
                    <span class="text-gray-500 text-sm">${error.timestamp}</span>
                </div>
                ${error.details ? `<div class="mt-2 text-sm text-gray-600 break-words">${error.details}</div>` : ''}
            </div>
        `;
    });
    
    htmlContent += '</div>';
    contentDiv.innerHTML = htmlContent;
}

// Configuration Bluetooth
const UUID = {
    SERVICE: '12345678-1234-5678-1234-56789abcdef0',
    CHARACTERISTIC: 'abcdef00-1234-5678-1234-56789abcdef0'
};

// Variables globales
let device;
let characteristic;
// Tableau pour stocker l'historique des erreurs
let errorHistory = [];
// Nombre maximum d'erreurs à conserver
const MAX_ERROR_HISTORY = 20;

// Connexion au capteur RFID et remplissage du champ RFID TAG
async function connectBLE() {
    try {
        showLoading(true, 'Connexion au lecteur RFID...');
        addLog('Tentative de connexion au lecteur RFID', LOG_TYPES.INFO);
        
        device = await navigator.bluetooth.requestDevice({
            filters: [{ name: 'GreenTrack-V2' }],
            optionalServices: [UUID.SERVICE]
        });

        addLog(`Appareil trouvé: ${device.name}`, LOG_TYPES.SUCCESS);
        
        const server = await device.gatt.connect();
        addLog('Connexion GATT établie', LOG_TYPES.INFO);
        
        const service = await server.getPrimaryService(UUID.SERVICE);
        addLog(`Service trouvé: ${UUID.SERVICE}`, LOG_TYPES.INFO);
        
        characteristic = await service.getCharacteristic(UUID.CHARACTERISTIC);
        addLog(`Caractéristique trouvée: ${UUID.CHARACTERISTIC}`, LOG_TYPES.INFO);

        await characteristic.startNotifications();
        addLog('Notifications activées', LOG_TYPES.SUCCESS);

        characteristic.addEventListener('characteristicvaluechanged', event => {
            const uid = new TextDecoder().decode(event.target.value);
            document.getElementById('rfidTag').value = uid;
            document.getElementById('clearRfid').classList.remove("hidden");
            
            // Animation pour montrer que le scan a réussi
            animateSuccess('rfidTag');
            showToast('Tag RFID détecté avec succès!');
            
            // Ajouter au log
            addLog(`Tag RFID détecté: ${uid}`, LOG_TYPES.SUCCESS);
        });
        
        showLoading(false);
        showToast('Connexion au lecteur RFID réussie');

    } catch (error) {
        console.error('Erreur:', error);
        showLoading(false);
        const errorMessage = 'Erreur de connexion au lecteur RFID';
        showToast(errorMessage, true);
        addLog(errorMessage, LOG_TYPES.ERROR, error.toString());
    }
}

// Suppression du scan RFID
document.getElementById('clearRfid').addEventListener('click', () => {
    document.getElementById('rfidTag').value = "";
    document.getElementById('clearRfid').classList.add("hidden");
});

// Récupération GPS
document.getElementById('getLocationBtn').addEventListener('click', () => {
    showLoading(true, 'Récupération de la position...');
    addLog('Demande de localisation GPS', LOG_TYPES.INFO);
    
    navigator.geolocation.getCurrentPosition(position => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        document.getElementById('gpsLocation').value = `Lat: ${lat}, Lng: ${lng}`;
        
        animateSuccess('gpsLocation');
        showLoading(false);
        showToast('Position GPS récupérée');
        
        addLog(`Position GPS récupérée: Lat: ${lat}, Lng: ${lng}`, LOG_TYPES.SUCCESS, {
            accuracy: position.coords.accuracy.toFixed(2) + 'm',
            timestamp: new Date(position.timestamp).toLocaleString()
        });
    }, (error) => {
        showLoading(false);
        console.error('Erreur GPS:', error);
        const errorMessage = "Impossible d'obtenir la localisation.";
        showToast(errorMessage, true);
        addLog(errorMessage, LOG_TYPES.ERROR, `Code: ${error.code}, Message: ${error.message}`);
    }, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    });
});

// Capture photo via la caméra
document.getElementById('photoBtn').addEventListener('click', () => {
    document.getElementById('treePhoto').click();
});

document.getElementById('treePhoto').addEventListener('change', function(event) {
    if (event.target.files.length > 0) {
        let src = URL.createObjectURL(event.target.files[0]);
        document.getElementById('photoPreview').src = src;
        document.getElementById('photoContainer').classList.remove("hidden");
        
        // Animation pour l'apparition de l'image
        document.getElementById('photoPreview').classList.add('animate-scale-in');
        setTimeout(() => {
            document.getElementById('photoPreview').classList.remove('animate-scale-in');
        }, 500);
        
        // Ajouter au log
        addLog('Photo capturée', LOG_TYPES.SUCCESS, {
            nom: event.target.files[0].name,
            taille: (event.target.files[0].size / 1024).toFixed(2) + ' KB',
            type: event.target.files[0].type
        });
    }
});

// Suppression de la photo
document.getElementById('clearPhoto').addEventListener('click', () => {
    document.getElementById('treePhoto').value = "";
    document.getElementById('photoContainer').classList.add("hidden");
    addLog('Photo supprimée', LOG_TYPES.INFO);
});

// Fonction de validation du formulaire
function validateForm() {
    const rfidTag = document.getElementById('rfidTag').value;
    const treeType = document.getElementById('treeType').value;
    const treeHeight = document.getElementById('treeHeight').value;
    const treeDate = document.getElementById('treeDate').value;
    const gpsLocation = document.getElementById('gpsLocation').value;
    
    if (!rfidTag) {
        showToast('Veuillez scanner un tag RFID', true);
        addLog('Validation du formulaire: tag RFID manquant', LOG_TYPES.WARNING);
        return false;
    }
    
    if (!treeType) {
        showToast('Veuillez entrer l\'espèce d\'arbre', true);
        document.getElementById('treeType').focus();
        addLog('Validation du formulaire: espèce d\'arbre manquante', LOG_TYPES.WARNING);
        return false;
    }
    
    if (!treeHeight) {
        showToast('Veuillez entrer la hauteur de l\'arbre', true);
        document.getElementById('treeHeight').focus();
        addLog('Validation du formulaire: hauteur manquante', LOG_TYPES.WARNING);
        return false;
    }
    
    if (!treeDate) {
        showToast('Veuillez sélectionner la date de plantation', true);
        document.getElementById('treeDate').focus();
        addLog('Validation du formulaire: date de plantation manquante', LOG_TYPES.WARNING);
        return false;
    }
    
    if (!gpsLocation) {
        showToast('Veuillez récupérer la position GPS', true);
        addLog('Validation du formulaire: position GPS manquante', LOG_TYPES.WARNING);
        return false;
    }
    
    addLog('Formulaire validé avec succès', LOG_TYPES.SUCCESS);
    return true;
}

// Enregistrement des données
document.getElementById('submitBtn').addEventListener('click', () => {
    if (!validateForm()) return;
    
    showLoading(true, 'Enregistrement en cours...');

    // Préparation des données pour l'API
    const rfidTag = document.getElementById('rfidTag').value;
    const treeType = document.getElementById('treeType').value;
    const treeHeight = document.getElementById('treeHeight').value;
    const treeDate = document.getElementById('treeDate').value;
    const gpsLocation = document.getElementById('gpsLocation').value;
    const fileInput = document.getElementById('treePhoto');
    
    // Création d'un objet FormData pour l'envoi multipart (nécessaire pour l'image)
    const formData = new FormData();
    formData.append('espece', treeType);
    formData.append('rfid', rfidTag);
    formData.append('date_plantation', treeDate);
    formData.append('humidite', '0'); // Valeur par défaut pour éviter l'erreur de type décimal
    formData.append('hauteur', treeHeight);
    
    // Extraction des coordonnées GPS depuis le format affiché
    // S'assurer qu'il n'y a qu'une seule virgule pour séparer latitude et longitude
    let coords = gpsLocation.replace('Lat: ', '').replace(' Lng: ', ',');
    // Vérifier s'il y a plus d'une virgule et la corriger si nécessaire
    if (coords.split(',').length > 2) {
        // Extraire uniquement les deux nombres (latitude et longitude)
        const coordParts = coords.match(/-?\d+(\.\d+)?/g);
        if (coordParts && coordParts.length >= 2) {
            coords = coordParts[0] + ',' + coordParts[1];
        }
    }
    formData.append('localisation', coords);
    
    // Log des données envoyées
    const logData = {
        espece: treeType,
        rfid: rfidTag,
        date_plantation: treeDate,
        hauteur: treeHeight,
        localisation: coords,
        image: fileInput.files.length > 0 ? fileInput.files[0].name : 'Aucune'
    };
    
    addLog('Envoi de données vers l\'API', LOG_TYPES.API, logData);
    
    // Ajout de l'image si disponible
    if (fileInput.files.length > 0) {
        formData.append('image', fileInput.files[0]);
    }
    
    // Envoi des données à l'API
    fetch('https://lycee-polyvalent-costebelle1.pro.dns-orange.fr/api.php', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erreur réseau: ' + response.status);
        }
        return response.text();
    })
    .then(data => {
        console.log('Réponse API:', data);
        addLog('Réponse reçue de l\'API', LOG_TYPES.API, data);
        
        if (data.includes('✅')) {
            // Succès
            addLog('Arbre enregistré avec succès', LOG_TYPES.SUCCESS);
            resetForm();
            showToast('Arbre enregistré avec succès!');
        } else {
            // Erreur
            addLog('Erreur retournée par l\'API', LOG_TYPES.ERROR, data);
            showToast('Erreur: ' + data, true);
        }
        
        showLoading(false);
    })
    .catch(error => {
        console.error('Erreur:', error);
        const errorMessage = 'Erreur de connexion au serveur. Veuillez réessayer.';
        showToast(errorMessage, true);
        addLog(errorMessage, LOG_TYPES.ERROR, error.toString());
        showLoading(false);
    });
});

// Événement pour lancer le scan RFID
document.getElementById('scanBtn').addEventListener('click', connectBLE);

// Réinitialiser le formulaire
function resetForm() {
    document.getElementById('rfidTag').value = "";
    document.getElementById('treeType').value = "";
    document.getElementById('treeHeight').value = "";
    document.getElementById('treeDate').value = "";
    document.getElementById('gpsLocation').value = "";
    document.getElementById('treePhoto').value = "";
    document.getElementById('photoContainer').classList.add("hidden");
    document.getElementById('clearRfid').classList.add("hidden");
    
    addLog('Formulaire réinitialisé', LOG_TYPES.INFO);
}

// Afficher un toast de notification
function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    
    if (isError) {
        toast.classList.remove('bg-green-600');
        toast.classList.add('bg-red-600');
        // Ajouter l'erreur à l'historique si c'est une erreur
        addLog(message, LOG_TYPES.ERROR);
    } else {
        toast.classList.remove('bg-red-600');
        toast.classList.add('bg-green-600');
    }
    
    setTimeout(() => {
        toast.classList.add('opacity-100');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('opacity-100');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 300);
    }, 3000);
}

// Afficher l'indicateur de chargement
function showLoading(show, message = 'Chargement...') {
    if (show) {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        
        toastMessage.innerHTML = `<i class="fas fa-circle-notch fa-spin mr-2"></i> ${message}`;
        toast.classList.remove('hidden', 'bg-red-600');
        toast.classList.add('bg-blue-600', 'opacity-100');
        
        addLog(`Chargement: ${message}`, LOG_TYPES.INFO);
    } else {
        const toast = document.getElementById('toast');
        toast.classList.remove('opacity-100');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 300);
    }
}

// Animation de succès pour les champs
function animateSuccess(elementId) {
    const element = document.getElementById(elementId);
    element.classList.add('success-animation');
    setTimeout(() => {
        element.classList.remove('success-animation');
    }, 1000);
}

// Fonction pour vérifier la connexion au serveur API
function checkApiConnection() {
    const apiStatus = document.getElementById('apiStatus');
    apiStatus.classList.remove('hidden');
    
    addLog('Vérification de la connexion au serveur API', LOG_TYPES.INFO);
    
    // Tentative de connexion simple à l'API (HEAD request)
    fetch('https://lycee-polyvalent-costebelle1.pro.dns-orange.fr/api.php', {
        method: 'HEAD'
    })
    .then(response => {
        if (response.ok) {
            apiStatus.innerHTML = `
                <div class="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <i class="fas fa-check-circle mr-2"></i>
                    <span>Connecté au serveur</span>
                </div>
            `;
            
            addLog('Connexion au serveur API établie', LOG_TYPES.SUCCESS);
            
            setTimeout(() => {
                apiStatus.classList.add('hidden');
            }, 3000);
        } else {
            throw new Error('Serveur non disponible');
        }
    })
    .catch(error => {
        console.error('Erreur de connexion API:', error);
        apiStatus.innerHTML = `
            <div class="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-red-100 text-red-800">
                <i class="fas fa-exclamation-circle mr-2"></i>
                <span>Impossible de se connecter au serveur</span>
            </div>
        `;
        addLog('Échec de la vérification de connexion au serveur', LOG_TYPES.ERROR, error.toString());
    });
}

// Ajouter le bouton d'historique des erreurs s'il n'existe pas déjà
function createErrorButton() {
    if (!document.getElementById('errorHistoryBtn')) {
        const errorBtn = document.createElement('button');
        errorBtn.id = 'errorHistoryBtn';
        errorBtn.className = 'fixed bottom-4 right-4 bg-red-600 text-white p-2 rounded-full shadow-lg hover:bg-red-700 transition-all flex items-center justify-center hidden';
        errorBtn.style.width = '48px';
        errorBtn.style.height = '48px';
        errorBtn.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <span class="error-count absolute -top-2 -right-2 bg-white text-red-600 rounded-full text-xs font-bold w-5 h-5 flex items-center justify-center">0</span>
        `;
        errorBtn.addEventListener('click', showErrorHistoryModal);
        document.body.appendChild(errorBtn);
        
        // Mettre à jour le compteur
        updateErrorButtonCount();
    }
}

// Créer et ajouter le bouton de logs
function createLogsButton() {
    if (!document.getElementById('logsBtn')) {
        const logsBtn = document.createElement('button');
        logsBtn.id = 'logsBtn';
        logsBtn.className = 'fixed bottom-20 right-4 bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700 transition-all flex items-center justify-center';
        logsBtn.style.width = '58px';
        logsBtn.style.height = '58px';
        logsBtn.innerHTML = `
            <div class="animate-pulse-slow">
                <i class="fas fa-clipboard-list text-xl"></i>
            </div>
            <span class="log-count absolute -top-2 -right-2 bg-white text-green-600 rounded-full text-xs font-bold w-6 h-6 flex items-center justify-center">0</span>
        `;
        
        // Ajouter un effet de rebond au survol
        logsBtn.addEventListener('mouseenter', () => {
            logsBtn.classList.add('animate-bounce-once');
            setTimeout(() => {
                logsBtn.classList.remove('animate-bounce-once');
            }, 1000);
        });
        
        logsBtn.addEventListener('click', showLogsModal);
        document.body.appendChild(logsBtn);
        
        // Mettre à jour le compteur
        updateLogButtonCount();
    }
}

// Vérifier la connexion API au chargement
document.addEventListener('DOMContentLoaded', function() {
    // Charger l'historique des erreurs
    loadErrorHistory();
    // Charger les logs
    loadLogs();
    // Initialiser l'interface
    checkApiConnection();
    
    // Créer les boutons
    createErrorButton();
    createLogsButton();
    
    // Ajouter quelques logs initiaux pour montrer le fonctionnement
    addLog('Application GreenTrack démarrée', LOG_TYPES.INFO);
    addLog('Version: 2.0', LOG_TYPES.INFO);
    addLog('Mode développeur actif', LOG_TYPES.INFO);

    // Vérifier si le navigateur supporte Web Bluetooth
    if ('bluetooth' in navigator) {
        addLog('Web Bluetooth API disponible', LOG_TYPES.SUCCESS);
    } else {
        addLog('Web Bluetooth API non supportée par ce navigateur', LOG_TYPES.WARNING);
    }

    // Vérifier si le navigateur supporte la géolocalisation
    if ('geolocation' in navigator) {
        addLog('Géolocalisation disponible', LOG_TYPES.SUCCESS);
    } else {
        addLog('Géolocalisation non supportée par ce navigateur', LOG_TYPES.WARNING);
    }

    // Vérifier l'état de la connexion
    if (navigator.onLine) {
        addLog('Appareil connecté à Internet', LOG_TYPES.SUCCESS);
    } else {
        addLog('Appareil hors ligne', LOG_TYPES.WARNING);
    }
});