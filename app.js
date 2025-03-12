// Configuration Bluetooth
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

});