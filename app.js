// Initialisation des événements lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - Initializing event listeners');
    
    // Initialisation des événements de mode
    document.getElementById('addModeBtn').addEventListener('click', function() {
        console.log('Switching to add mode');
        switchMode('add');
    });
    
    document.getElementById('readModeBtn').addEventListener('click', function() {
        console.log('Switching to read mode');
        switchMode('read');
    });
    
    // Événements pour le scan RFID
    document.getElementById('scanBtn').addEventListener('click', function() {
        console.log('Scanning in add mode');
        connectBLE();
    });
    
    document.getElementById('scanBtnRead').addEventListener('click', function() {
        console.log('Scanning in read mode');
        connectBLE();
    });
    
    // Événements pour les boutons de déconnexion
    document.getElementById('disconnectBtn').addEventListener('click', disconnectBLE);
    document.getElementById('disconnectBtnRead').addEventListener('click', disconnectBLE);
    
    // Événement pour le bouton de rafraîchissement
    document.getElementById('refreshBtn').addEventListener('click', refreshTreeData);
    
    // Événements pour la gestion des tags RFID
    document.getElementById('clearRfid').addEventListener('click', clearRfidTag);
    document.getElementById('clearRfidRead').addEventListener('click', clearRfidTagRead);
    
    // Événements pour la géolocalisation
    document.getElementById('getLocationBtn').addEventListener('click', function() {
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
    
    // Événements pour la photo
    document.getElementById('photoBtn').addEventListener('click', function() {
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
    
    document.getElementById('clearPhoto').addEventListener('click', clearPhoto);
    
    // Événement pour soumettre le formulaire
    document.getElementById('submitBtn').addEventListener('click', submitTreeData);
    
    // Initialiser les logs d'erreur
    document.getElementById('errorLogBtn').addEventListener('click', showErrorLogs);
    
    // Remplacer les onclick par des événements
    document.querySelectorAll('[onclick="closeErrorLogs()"]').forEach(element => {
        element.removeAttribute('onclick');
        element.addEventListener('click', closeErrorLogs);
    });
    
    // Charger l'historique des erreurs
    loadErrorHistory();
    
    // Vérification de la connexion à l'API
    checkApiConnection();
    
    // Initialiser le mode par défaut (Ajout)
    switchMode('add');
    
    console.log('All event listeners initialized');
});// Configuration Bluetooth
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
async function connectBLE() {
    try {
        showLoading(true, 'Connexion au lecteur RFID...');
        
        // Si un appareil est déjà connecté, essayer de le réutiliser
        if (device && device.gatt) {
            try {
                console.log('Tentative de reconnexion à l\'appareil existant...');
                // Vérifier si l'appareil est déjà connecté
                if (!device.gatt.connected) {
                    const server = await device.gatt.connect();
                    console.log('Reconnexion réussie');
                    
                    // Récupérer le service et la caractéristique
                    const service = await server.getPrimaryService(UUID.SERVICE);
                    characteristic = await service.getCharacteristic(UUID.CHARACTERISTIC);
                    
                    // Démarrer les notifications
                    await characteristic.startNotifications();
                    setupNotifications();
                    
                    showToast('Reconnexion au lecteur RFID réussie');
                    updateScanButtons(true);
                    showLoading(false);
                    return;
                } else {
                    console.log('Appareil déjà connecté');
                    setupNotifications(); // S'assurer que les notifications sont configurées
                    showToast('Lecteur RFID déjà connecté');
                    updateScanButtons(true);
                    showLoading(false);
                    return;
                }
            } catch (reconnectError) {
                console.error('Échec de la reconnexion:', reconnectError);
                // Continuer avec une nouvelle connexion
                device = null;
                characteristic = null;
            }
        }
        
        // Nouvelle connexion
        device = await navigator.bluetooth.requestDevice({
            filters: [{ name: 'GreenTrack-V2' }],
            optionalServices: [UUID.SERVICE]
        });

        console.log('Appareil sélectionné:', device.name);
        
        const server = await device.gatt.connect();
        console.log('Connecté au serveur GATT');
        
        const service = await server.getPrimaryService(UUID.SERVICE);
        console.log('Service trouvé');
        
        characteristic = await service.getCharacteristic(UUID.CHARACTERISTIC);
        console.log('Caractéristique trouvée');

        await characteristic.startNotifications();
        console.log('Notifications activées');
        
        setupNotifications();
        
        showLoading(false);
        showToast('Connexion au lecteur RFID réussie');
        updateScanButtons(true);
        
        // Ajouter un gestionnaire d'événements pour détecter la déconnexion
        device.addEventListener('gattserverdisconnected', onDisconnected);

    } catch (error) {
        console.error('Erreur de connexion:', error);
        showLoading(false);
        
        // Gérer spécifiquement l'erreur d'annulation par l'utilisateur
        if (error.name === 'NotFoundError' && error.message.includes('cancelled')) {
            showToast('Sélection du lecteur RFID annulée', true);
        } else {
            const errorMessage = 'Erreur de connexion au lecteur RFID';
            showToast(errorMessage, true);
            addErrorToHistory(errorMessage, error.toString());
        }
        
        // Réinitialiser les variables
        device = null;
        characteristic = null;
        updateScanButtons(false);
    }
}

// Configuration des notifications pour le RFID
function setupNotifications() {
    if (!characteristic) return;
    
    // Supprimer les écouteurs existants pour éviter les duplications
    characteristic.removeEventListener('characteristicvaluechanged', handleRFIDValue);
    
    // Ajouter un nouvel écouteur
    characteristic.addEventListener('characteristicvaluechanged', handleRFIDValue);
    console.log('Écouteur de notifications configuré');
}

// Fonction pour gérer les valeurs RFID reçues
function handleRFIDValue(event) {
    const uid = new TextDecoder().decode(event.target.value);
    console.log('Tag RFID détecté:', uid);
    
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
}

// Gestionnaire de déconnexion
function onDisconnected(event) {
    console.log('Appareil déconnecté:', event.target.name);
    updateScanButtons(false);
    showToast('Lecteur RFID déconnecté', true);
    
    // Si en mode lecture, masquer les résultats
    if (currentMode === 'read' && document.getElementById('readResults').classList.contains('hidden') === false) {
        document.getElementById('scanMessage').classList.remove('hidden');
        document.getElementById('readResults').classList.add('hidden');
    }
}

// Mettre à jour les boutons de scan selon l'état de connexion
function updateScanButtons(connected) {
    if (connected) {
        // Masquer les boutons de scan, afficher les boutons de déconnexion
        if (currentMode === 'add') {
            document.getElementById('disconnectBtn').classList.remove("hidden");
            document.getElementById('scanBtn').classList.add("hidden");
        } else {
            document.getElementById('disconnectBtnRead').classList.remove("hidden");
            document.getElementById('scanBtnRead').classList.add("hidden");
        }
    } else {
        // Afficher les boutons de scan, masquer les boutons de déconnexion
        if (currentMode === 'add') {
            document.getElementById('disconnectBtn').classList.add("hidden");
            document.getElementById('scanBtn').classList.remove("hidden");
        } else {
            document.getElementById('disconnectBtnRead').classList.add("hidden");
            document.getElementById('scanBtnRead').classList.remove("hidden");
        }
    }
}

// Fonction pour déconnecter le RFID
async function disconnectBLE() {
    try {
        showLoading(true, 'Déconnexion du lecteur RFID...');
        
        if (characteristic) {
            try {
                await characteristic.stopNotifications();
                console.log('Notifications arrêtées');
            } catch (notifError) {
                console.error('Erreur lors de l\'arrêt des notifications:', notifError);
            }
            characteristic = null;
        }
        
        if (device && device.gatt) {
            if (device.gatt.connected) {
                device.gatt.disconnect();
                console.log('Appareil déconnecté manuellement');
            }
        }
        
        device = null;
        
        showLoading(false);
        showToast('Déconnexion du lecteur RFID réussie');
        updateScanButtons(false);
        
    } catch (error) {
        console.error('Erreur de déconnexion:', error);
        showLoading(false);
        const errorMessage = 'Erreur lors de la déconnexion du lecteur RFID';
        showToast(errorMessage, true);
        addErrorToHistory(errorMessage, error.toString());
        
        // Forcer la réinitialisation des variables
        device = null;
        characteristic = null;
        updateScanButtons(false);
    }
}

// Chargement des données de l'arbre
async function loadTreeData(rfid) {
    try {
        showLoading(true, 'Chargement des données...');
        
        // Vérifier si le RFID est valide
        if (!rfid || rfid.trim() === '') {
            throw new Error('Tag RFID invalide ou vide');
        }
        
        console.log('Chargement des données pour le RFID:', rfid);
        
        // Récupération des données depuis l'API
        const response = await fetch(`https://greentrack.dns.army/api.php?action=read&rfid=${rfid}`);
        
        if (!response.ok) {
            throw new Error('Erreur réseau: ' + response.status);
        }
        
        // Récupérer d'abord le texte pour le vérifier
        const responseText = await response.text();
        console.log('Réponse API (texte):', responseText);
        
        // Si la réponse est vide, gérer le cas
        if (!responseText || responseText.trim() === '') {
            throw new Error('Aucune donnée reçue du serveur');
        }
        
        // Essayer de parser le JSON
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (jsonError) {
            console.error('Erreur de parsing JSON:', jsonError);
            // Si le texte contient certains mots-clés, on peut le traiter comme un message d'erreur
            if (responseText.includes('erreur') || responseText.includes('Erreur') || responseText.includes('error')) {
                throw new Error('Erreur API: ' + responseText);
            } else {
                throw new Error('Format de réponse invalide: ' + jsonError.message);
            }
        }
        
        // Si le statut est une erreur, le signaler
        if (data.status === 'error') {
            throw new Error(data.message || 'Erreur lors de la récupération des données');
        }
        
        console.log('Données chargées:', data);
        
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

// Amélioration de l'envoi des données au serveur
async function submitTreeData() {
    if (!validateForm()) return;
    
    showLoading(true, 'Enregistrement en cours...');

    // Préparation des données pour l'API
    const rfidTag = document.getElementById('rfidTag').value;
    const treeType = document.getElementById('treeType').value;
    const treeHeight = document.getElementById('treeHeight').value;
    const treeDate = document.getElementById('treeDate').value;
    const gpsLocation = document.getElementById('gpsLocation').value;
    const fileInput = document.getElementById('treePhoto');
    
    console.log('Données à envoyer:', {
        rfid: rfidTag,
        espece: treeType,
        hauteur: treeHeight,
        date: treeDate,
        localisation: gpsLocation,
        image: fileInput.files.length > 0 ? 'Présente' : 'Absente'
    });
    
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
    
    try {
        // Envoi des données à l'API avec timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 secondes timeout
        
        const response = await fetch('https://greentrack.dns.army/api.php', {
            method: 'POST',
            body: formData,
            signal: controller.signal
        });
        
        clearTimeout(timeoutId); // Annuler le timeout
        
        if (!response.ok) {
            throw new Error('Erreur réseau: ' + response.status);
        }
        
        const responseText = await response.text();
        console.log('Réponse API (texte):', responseText);
        
        if (responseText.includes('✅')) {
            // Succès
            resetForm();
            showToast('Arbre enregistré avec succès!');
        } else {
            // Erreur
            const errorMessage = 'Erreur: ' + responseText;
            showToast(errorMessage, true);
            // Ajouter l'erreur API à l'historique aussi
            addErrorToHistory(errorMessage, `Réponse API: ${responseText}`);
        }
    } catch (error) {
        console.error('Erreur:', error);
        
        // Message spécifique pour les erreurs de timeout
        if (error.name === 'AbortError') {
            const errorMessage = 'La requête a pris trop de temps. Vérifiez votre connexion et réessayez.';
            showToast(errorMessage, true);
            addErrorToHistory(errorMessage, error.toString());
        } else {
            const errorMessage = 'Erreur de connexion au serveur. Veuillez réessayer.';
            showToast(errorMessage, true);
            addErrorToHistory(errorMessage, error.toString());
        }
    } finally {
        showLoading(false);
    }
}

// Suppression du scan RFID (Mode Ajout)
function clearRfidTag() {
    document.getElementById('rfidTag').value = "";
    document.getElementById('clearRfid').classList.add("hidden");
}

// Suppression du scan RFID (Mode Lecture)
function clearRfidTagRead() {
    document.getElementById('rfidTagRead').value = "";
    document.getElementById('clearRfidRead').classList.add("hidden");
    document.getElementById('readResults').classList.add('hidden');
    document.getElementById('scanMessage').classList.remove('hidden');
    resetReadFields();
}

// Fonction pour supprimer la photo
function clearPhoto() {
    document.getElementById('treePhoto').value = "";
    document.getElementById('photoContainer').classList.add("hidden");
}

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