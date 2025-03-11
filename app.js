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
}// Configuration Bluetooth
const UUID = {
    SERVICE: '12345678-1234-5678-1234-56789abcdef0',
    CHARACTERISTIC: 'abcdef00-1234-5678-1234-56789abcdef0'
};// Variables globales
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
            document.getElementById('rfidTag').value = uid;
            document.getElementById('clearRfid').classList.remove("hidden");
            
            // Animation pour montrer que le scan a réussi
            animateSuccess('rfidTag');
            showToast('Tag RFID détecté avec succès!');
        });
        
        showLoading(false);
        showToast('Connexion au lecteur RFID réussie');

    } catch (error) {
        console.error('Erreur:', error);
        showLoading(false);
        const errorMessage = 'Erreur de connexion au lecteur RFID';
        showToast(errorMessage, true);
        addErrorToHistory(errorMessage, error.toString());
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
        
        if (data.includes('✅')) {
            // Succès
            resetForm();
            showToast('Arbre enregistré avec succès!');
        } else {
            // Erreur
            showToast('Erreur: ' + data, true);
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

// Vérifier la connexion API au chargement
document.addEventListener('DOMContentLoaded', function() {
    // Charger l'historique des erreurs
    loadErrorHistory();
    // Initialiser l'interface
    checkApiConnection();
    
    // Ajouter le bouton d'historique des erreurs s'il n'existe pas déjà
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
});