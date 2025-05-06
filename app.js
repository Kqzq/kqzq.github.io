// Configuration Bluetooth
const UUID = {
    SERVICE: '12345678-1234-5678-1234-56789abcdef0',
    CHARACTERISTIC: 'abcdef00-1234-5678-1234-56789abcdef0'
};

// Variables globales
let device;
let characteristic;
let currentMode = 'add'; // 'add' ou 'read'
// Tableau pour stocker l'historique des erreurs
let errorHistory = [];
// Nombre maximum d'erreurs à conserver
const MAX_ERROR_HISTORY = 20;

// Fonctions pour la gestion des logs d'erreurs
function addErrorToHistory(errorMessage, details = '') {
    const timestamp = new Date().toLocaleString();
    errorHistory.unshift({
        timestamp: timestamp,
        message: errorMessage,
        details: details
    });
    
    // Limiter la taille de l'historique
    if (errorHistory.length > MAX_ERROR_HISTORY) {
        errorHistory.pop();
    }
    
    // Sauvegarder dans le stockage local
    saveErrorHistory();
    
    // Mettre à jour le compteur d'erreurs sur le bouton
    updateErrorCounter();
}

function saveErrorHistory() {
    localStorage.setItem('errorHistory', JSON.stringify(errorHistory));
}

function loadErrorHistory() {
    const saved = localStorage.getItem('errorHistory');
    if (saved) {
        errorHistory = JSON.parse(saved);
        updateErrorCounter();
    }
}

function updateErrorCounter() {
    const counter = document.getElementById('errorCounter');
    if (counter && errorHistory.length > 0) {
        counter.textContent = errorHistory.length;
        counter.classList.remove('hidden');
    } else if (counter) {
        counter.classList.add('hidden');
    }
}

function showErrorLogs() {
    const modalContent = document.getElementById('errorLogContent');
    modalContent.innerHTML = '';
    
    if (errorHistory.length === 0) {
        modalContent.innerHTML = '<p class="text-gray-500 text-center py-4">Aucune erreur enregistrée</p>';
    } else {
        // Créer un conteneur pour les erreurs
        const errorsContainer = document.createElement('div');
        errorsContainer.className = 'pb-2'; // Padding bottom pour éviter que le dernier élément soit coupé
        
        errorHistory.forEach((error, index) => {
            const errorElement = document.createElement('div');
            errorElement.className = 'border-b border-gray-200 py-3 px-4 ' + (index % 2 === 0 ? 'bg-gray-50' : '');
            errorElement.innerHTML = `
                <div class="flex justify-between">
                    <span class="font-medium text-red-600">${error.message}</span>
                    <span class="text-xs text-gray-500">${error.timestamp}</span>
                </div>
                ${error.details ? `<div class="text-sm text-gray-700 mt-1">${error.details}</div>` : ''}
            `;
            errorsContainer.appendChild(errorElement);
        });
        
        modalContent.appendChild(errorsContainer);
        
        // Bouton pour effacer les logs
        const clearButton = document.createElement('button');
        clearButton.className = 'mt-4 w-full bg-red-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-red-600 transition-all sticky bottom-0';
        clearButton.innerHTML = '<i class="fas fa-trash-alt mr-2"></i> Effacer tous les logs';
        clearButton.onclick = clearErrorLogs;
        modalContent.appendChild(clearButton);
    }
    
    document.getElementById('errorLogModal').classList.remove('hidden');
    
    // Forcer le rafraîchissement du défilement après l'affichage du modal
    setTimeout(() => {
        modalContent.scrollTop = 0;
    }, 10);
}

function closeErrorLogs() {
    document.getElementById('errorLogModal').classList.add('hidden');
}

function clearErrorLogs() {
    errorHistory = [];
    saveErrorHistory();
    updateErrorCounter();
    showErrorLogs(); // Rafraîchir l'affichage
}

// Connexion au capteur RFID et remplissage du champ RFID TAG
async function connectBLE(forReading = false) {
    try {
        showLoading(true, 'Connexion au lecteur RFID...');
        
        device = await navigator.bluetooth.requestDevice({
            filters: [{ name: 'GreenTrack-V2' }],
            optionalServices: [UUID.SERVICE]
        });

        const server = await device.gatt.connect();
        const service = await server.getPrimaryService(UUID.SERVICE);
        characteristic = await service.getCharacteristic(UUID.CHARACTERISTIC);

        await characteristic.startNotifications();

        characteristic.addEventListener('characteristicvaluechanged', event => {
            const uid = new TextDecoder().decode(event.target.value);
            
            if (currentMode === 'add') {
                document.getElementById('rfidTag').value = uid;
                document.getElementById('clearRfid').classList.remove("hidden");
                // Animation pour montrer que le scan a réussi
                animateSuccess('rfidTag');
                showToast('Tag RFID détecté avec succès!');
            } else {
                document.getElementById('rfidTagRead').value = uid;
                document.getElementById('clearRfidRead').classList.remove("hidden");
                document.getElementById('scanMessage').classList.add('hidden');
                
                // Animation pour montrer que le scan a réussi
                animateSuccess('rfidTagRead');
                showToast('Tag RFID détecté avec succès! Chargement des données...');
                
                // Charger les données de l'arbre
                loadTreeData(uid);
                
                // Afficher les résultats
                document.getElementById('readResults').classList.remove('hidden');
            }
        });
        
        showLoading(false);
        showToast('Connexion au lecteur RFID réussie');
        
        // Afficher le bouton de déconnexion RFID après une connexion réussie
        if (currentMode === 'add') {
            document.getElementById('disconnectBtn').classList.remove("hidden");
            document.getElementById('scanBtn').classList.add("hidden");
        } else {
            document.getElementById('disconnectBtnRead').classList.remove("hidden");
            document.getElementById('scanBtnRead').classList.add("hidden");
        }

    } catch (error) {
        console.error('Erreur:', error);
        showLoading(false);
        const errorMessage = 'Erreur de connexion au lecteur RFID';
        showToast(errorMessage, true);
        addErrorToHistory(errorMessage, error.toString());
    }
}

// Fonction pour déconnecter le RFID
async function disconnectBLE() {
    try {
        showLoading(true, 'Déconnexion du lecteur RFID...');
        
        if (characteristic) {
            await characteristic.stopNotifications();
            characteristic = null;
        }
        
        if (device && device.gatt && device.gatt.connected) {
            device.gatt.disconnect();
        }
        
        device = null;
        
        showLoading(false);
        showToast('Déconnexion du lecteur RFID réussie');
        
        // Cacher le bouton de déconnexion et afficher le bouton de scan
        if (currentMode === 'add') {
            document.getElementById('disconnectBtn').classList.add("hidden");
            document.getElementById('scanBtn').classList.remove("hidden");
        } else {
            document.getElementById('disconnectBtnRead').classList.add("hidden");
            document.getElementById('scanBtnRead').classList.remove("hidden");
        }
        
    } catch (error) {
        console.error('Erreur de déconnexion:', error);
        showLoading(false);
        const errorMessage = 'Erreur lors de la déconnexion du lecteur RFID';
        showToast(errorMessage, true);
        addErrorToHistory(errorMessage, error.toString());
    }
}

// Chargement des données de l'arbre
async function loadTreeData(rfid) {
    try {
        showLoading(true, 'Chargement des données...');
        
        // Récupération des données depuis l'API
        const response = await fetch(`https://greentrack.dns.army/api.php?action=read&rfid=${rfid}`);
        
        if (!response.ok) {
            throw new Error('Erreur réseau: ' + response.status);
        }
        
        const data = await response.json();
        
        if (data.status === 'error') {
            throw new Error(data.message || 'Erreur lors de la récupération des données');
        }
        
        // Mise à jour de l'interface avec les données récupérées
        document.getElementById('treeTypeRead').textContent = data.espece || '-';
        document.getElementById('treeHeightRead').textContent = data.hauteur ? `${data.hauteur} cm` : '-';
        document.getElementById('treeDateRead').textContent = formatDate(data.date_plantation) || '-';
        document.getElementById('locationRead').textContent = formatLocation(data.localisation) || '-';
        document.getElementById('humidityRead').textContent = data.humidite ? `${data.humidite}%` : '-';
        document.getElementById('rfidInfoRead').textContent = data.rfid || rfid;
        
        // Affichage de l'image si disponible
        if (data.image_url) {
            document.getElementById('photoPreviewRead').src = data.image_url;
            document.getElementById('treePhotoRead').classList.remove('hidden');
        } else {
            document.getElementById('treePhotoRead').classList.add('hidden');
        }
        
        // Configurer les boutons de carte si des coordonnées sont disponibles
        if (data.localisation) {
            const coords = parseLocationString(data.localisation);
            if (coords) {
                document.getElementById('viewMapBtn').onclick = () => {
                    window.open(`https://www.google.com/maps?q=${coords.lat},${coords.lng}`, '_blank');
                };
                
                document.getElementById('directionsBtn').onclick = () => {
                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`, '_blank');
                };
                
                document.getElementById('mapMessage').textContent = 'Carte disponible';
            } else {
                document.getElementById('mapMessage').textContent = 'Coordonnées invalides';
            }
        } else {
            document.getElementById('mapMessage').textContent = 'Localisation non disponible';
        }
        
        showLoading(false);
        showToast('Données chargées avec succès');
        
    } catch (error) {
        console.error('Erreur:', error);
        showLoading(false);
        const errorMessage = 'Erreur de chargement des données';
        showToast(errorMessage, true);
        addErrorToHistory(errorMessage, error.toString());
        
        // Réinitialiser les champs en cas d'erreur
        resetReadFields();
    }
}

// Fonctions utilitaires pour le mode lecture
function formatDate(dateString) {
    if (!dateString) return '-';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (e) {
        return dateString;
    }
}

function formatLocation(locationString) {
    if (!locationString) return '-';
    
    const coords = parseLocationString(locationString);
    if (coords) {
        return `Lat: ${coords.lat}, Lng: ${coords.lng}`;
    }
    
    return locationString;
}

function parseLocationString(locationString) {
    if (!locationString) return null;
    
    // Différents formats possibles
    // Format 1: "48.8566,2.3522"
    // Format 2: "Lat: 48.8566, Lng: 2.3522"
    
    try {
        // Nettoyer la chaîne
        let cleaned = locationString.replace('Lat: ', '').replace(' Lng: ', ',');
        
        // Extraire uniquement les nombres
        const numbers = cleaned.match(/-?\d+(\.\d+)?/g);
        if (numbers && numbers.length >= 2) {
            return {
                lat: parseFloat(numbers[0]),
                lng: parseFloat(numbers[1])
            };
        }
    } catch (e) {
        console.error('Erreur de parsing des coordonnées:', e);
    }
    
    return null;
}

function resetReadFields() {
    document.getElementById('treeTypeRead').textContent = '-';
    document.getElementById('treeHeightRead').textContent = '-';
    document.getElementById('treeDateRead').textContent = '-';
    document.getElementById('locationRead').textContent = '-';
    document.getElementById('humidityRead').textContent = '-';
    document.getElementById('rfidInfoRead').textContent = '-';
    document.getElementById('treePhotoRead').classList.add('hidden');
    document.getElementById('mapMessage').textContent = 'Carte non disponible';
}

// Fonction pour rafraîchir les données
function refreshTreeData() {
    const rfid = document.getElementById('rfidTagRead').value;
    if (rfid) {
        loadTreeData(rfid);
    } else {
        showToast('Aucun tag RFID scanné', true);
    }
}

// Suppression du scan RFID (Mode Ajout)
document.getElementById('clearRfid').addEventListener('click', () => {
    document.getElementById('rfidTag').value = "";
    document.getElementById('clearRfid').classList.add("hidden");
});

// Suppression du scan RFID (Mode Lecture)
document.getElementById('clearRfidRead').addEventListener('click', () => {
    document.getElementById('rfidTagRead').value = "";
    document.getElementById('clearRfidRead').classList.add("hidden");
    document.getElementById('readResults').classList.add('hidden');
    document.getElementById('scanMessage').classList.remove('hidden');
    resetReadFields();
});

// Récupération GPS
document.getElementById('getLocationBtn').addEventListener('click', () => {
    showLoading(true, 'Récupération de la position...');
    
    navigator.geolocation.getCurrentPosition(position => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        document.getElementById('gpsLocation').value = `Lat: ${lat}, Lng: ${lng}`;
        
        animateSuccess('gpsLocation');
        showLoading(false);
        showToast('Position GPS récupérée');
    }, (error) => {
        showLoading(false);
        console.error('Erreur GPS:', error);
        const errorMessage = "Impossible d'obtenir la localisation.";
        showToast(errorMessage, true);
        addErrorToHistory(errorMessage, `Code: ${error.code}, Message: ${error.message}`);
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
    }
});

// Suppression de la photo
document.getElementById('clearPhoto').addEventListener('click', () => {
    document.getElementById('treePhoto').value = "";
    document.getElementById('photoContainer').classList.add("hidden");
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
        return false;
    }
    
    if (!treeType) {
        showToast('Veuillez entrer l\'espèce d\'arbre', true);
        document.getElementById('treeType').focus();
        return false;
    }
    
    if (!treeHeight) {
        showToast('Veuillez entrer la hauteur de l\'arbre', true);
        document.getElementById('treeHeight').focus();
        return false;
    }
    
    if (!treeDate) {
        showToast('Veuillez sélectionner la date de plantation', true);
        document.getElementById('treeDate').focus();
        return false;
    }
    
    if (!gpsLocation) {
        showToast('Veuillez récupérer la position GPS', true);
        return false;
    }
    
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
    
    // Correction pour l'erreur d'API - Ajout du mode_humidite
    formData.append('mode_humidite', 'manuel'); // Définir 'manuel' comme valeur par défaut
    
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
    console.log('Coordonnées envoyées:', coords);
    
    // Ajout de l'image si disponible
    if (fileInput.files.length > 0) {
        formData.append('image', fileInput.files[0]);
    }
    
    // Envoi des données à l'API
    fetch('https://greentrack.dns.army/api.php', {
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
        
        if (data.includes('✅')) {
            // Succès
            resetForm();
            showToast('Arbre enregistré avec succès!');
        } else {
            // Erreur
            const errorMessage = 'Erreur: ' + data;
            showToast(errorMessage, true);
            // Ajouter l'erreur API à l'historique aussi
            addErrorToHistory(errorMessage, `Réponse API: ${data}`);
        }
        
        showLoading(false);
    })
    .catch(error => {
        console.error('Erreur:', error);
        const errorMessage = 'Erreur de connexion au serveur. Veuillez réessayer.';
        showToast(errorMessage, true);
        addErrorToHistory(errorMessage, error.toString());
        showLoading(false);
    });
});

// Événement pour lancer le scan RFID (Mode Ajout)
document.getElementById('scanBtn').addEventListener('click', () => connectBLE(false));

// Événement pour lancer le scan RFID (Mode Lecture)
document.getElementById('scanBtnRead').addEventListener('click', () => connectBLE(true));

// Événement pour la déconnexion RFID (Mode Lecture)
document.getElementById('disconnectBtnRead').addEventListener('click', disconnectBLE);

// Événement pour rafraîchir les données
document.getElementById('refreshBtn').addEventListener('click', refreshTreeData);

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
    
    // Masquer le bouton de déconnexion si visible et afficher le bouton de scan
    document.getElementById('disconnectBtn').classList.add("hidden");
    document.getElementById('scanBtn').classList.remove("hidden");
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
        addErrorToHistory(message);
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
    
    // Tentative de connexion simple à l'API (HEAD request)
    fetch('https://greentrack.dns.army/api.php', {
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
        addErrorToHistory('Échec de la vérification de connexion au serveur', error.toString());
    });
}

// Gestion des modes (Ajout/Lecture)
function switchMode(mode) {
    currentMode = mode;
    
    if (mode === 'add') {
        // Activer le mode Ajout
        document.getElementById('addModeForm').classList.remove('hidden');
        document.getElementById('readModeForm').classList.add('hidden');
        document.getElementById('addModeBtn').classList.add('bg-green-600', 'text-white');
        document.getElementById('addModeBtn').classList.remove('bg-transparent', 'text-gray-700');
        document.getElementById('readModeBtn').classList.remove('bg-green-600', 'text-white');
        document.getElementById('readModeBtn').classList.add('bg-transparent', 'text-gray-700');
    } else {
        // Activer le mode Lecture
        document.getElementById('addModeForm').classList.add('hidden');
        document.getElementById('readModeForm').classList.remove('hidden');
        document.getElementById('readModeBtn').classList.add('bg-green-600', 'text-white');
        document.getElementById('readModeBtn').classList.remove('bg-transparent', 'text-gray-700');
        document.getElementById('addModeBtn').classList.remove('bg-green-600', 'text-white');
        document.getElementById('addModeBtn').classList.add('bg-transparent', 'text-gray-700');
    }
    
    // Si connecté au BLE, déconnecter lors du changement de mode
    if (device && device.gatt && device.gatt.connected) {
        disconnectBLE();
    }
}

// Événements pour changer de mode
document.getElementById('addModeBtn').addEventListener('click', () => switchMode('add'));
document.getElementById('readModeBtn').addEventListener('click', () => switchMode('read'));

// Vérifier la connexion API au chargement
document.addEventListener('DOMContentLoaded', function() {
    // S'assurer que le modal d'erreur est masqué au chargement
    const errorLogModal = document.getElementById('errorLogModal');
    if (errorLogModal) {
        errorLogModal.classList.add('hidden');
    }
    
    // Charger l'historique des erreurs
    loadErrorHistory();
    
    // Initialiser l'interface
    checkApiConnection();
    
    // Ajouter l'event listener pour le bouton de logs
    const errorLogBtn = document.getElementById('errorLogBtn');
    if (errorLogBtn) {
        errorLogBtn.addEventListener('click', showErrorLogs);
    }
    
    // Initialiser le mode par défaut (Ajout)
    switchMode('add');
});gatt.