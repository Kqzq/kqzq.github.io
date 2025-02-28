// Configuration BLE - Doit correspondre EXACTEMENT à l'ESP32
const SERVICE_UUID = '9eaa1c40-0f6a-4b0a-8a17-51a8f3f5d3f6';
const CHARACTERISTIC_UUID = 'd68b73b0-3840-4e7b-8b4d-2f074c4c7875';
const DEVICE_NAME = 'GreenTrack-ESP32';
const MAX_HISTORY = 10;

// Variables d'état
let device = null;
let characteristic = null;
let history = [];
let isConnecting = false;

// Éléments UI
const connectBtn = document.getElementById('connectBtn');
const statusLed = document.getElementById('statusLed');
const statusText = document.getElementById('statusText');
const lastUid = document.getElementById('lastUid');
const historyList = document.getElementById('history');

// Mode debug
const DEBUG_MODE = true;
function logDebug(...messages) {
    if(DEBUG_MODE) console.log('[DEBUG]', ...messages);
}

// Gestionnaire de connexion
connectBtn.addEventListener('click', async () => {
    try {
        if(isConnecting) return;
        
        if (device?.gatt?.connected) {
            await device.gatt.disconnect();
            return;
        }

        isConnecting = true;
        updateStatus('Recherche de l\'appareil...', 'searching');
        
        logDebug('Début de la connexion BLE...');
        device = await navigator.bluetooth.requestDevice({
            filters: [{
                name: DEVICE_NAME,
                services: [SERVICE_UUID]
            }],
            optionalServices: [SERVICE_UUID]
        });

        if (!device) {
            throw new Error('Appareil non sélectionné');
        }

        updateStatus('Connexion en cours...', 'connecting');
        logDebug('Tentative de connexion à', device.name);
        
        const server = await device.gatt.connect();
        logDebug('Connecté au serveur GATT');

        const service = await server.getPrimaryService(SERVICE_UUID);
        logDebug('Service trouvé:', service.uuid);

        characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);
        logDebug('Caractéristique trouvée:', characteristic.uuid);

        await characteristic.startNotifications();
        logDebug('Notifications activées');

        characteristic.addEventListener('characteristicvaluechanged', handleData);
        device.addEventListener('gattserverdisconnected', onDisconnect);

        updateStatus('Connecté - Prêt à scanner', 'connected');
        connectBtn.textContent = 'Déconnecter';
        
    } catch (error) {
        console.error('Erreur de connexion:', error);
        updateStatus(`Erreur: ${error.message}`, 'error');
        resetConnection();
    } finally {
        isConnecting = false;
    }
});

// Gestion des données reçues
function handleData(event) {
    try {
        const decoder = new TextDecoder('utf-8');
        const uid = decoder.decode(event.target.value);
        logDebug('UID reçu:', uid);
        
        updateUID(uid);
        addToHistory(uid);
        
    } catch (error) {
        console.error('Erreur traitement des données:', error);
    }
}

// Mise à jour de l'interface
function updateUID(uid) {
    lastUid.textContent = uid;
    lastUid.classList.add('animate-pulse');
    setTimeout(() => lastUid.classList.remove('animate-pulse'), 500);
}

function addToHistory(uid) {
    history = [{
        uid,
        timestamp: new Date().toLocaleTimeString()
    }, ...history.slice(0, MAX_HISTORY - 1)];

    historyList.innerHTML = history.map(entry => `
        <div class="history-item">
            <i class="fas fa-fingerprint text-green-400 mr-2"></i>
            <span class="uid">${entry.uid}</span>
            <span class="timestamp">${entry.timestamp}</span>
        </div>
    `).join('');
}

// Gestion des états
function updateStatus(text, state) {
    statusText.textContent = text;
    statusLed.className = 'status-led';
    
    switch(state) {
        case 'connected':
            statusLed.classList.add('connected');
            break;
        case 'searching':
            statusLed.classList.add('searching');
            break;
        case 'error':
            statusLed.classList.add('error');
            break;
        default:
            statusLed.classList.add('disconnected');
    }
}

// Réinitialisation connexion
function resetConnection() {
    if (characteristic) {
        characteristic.stopNotifications().catch(() => {});
        characteristic.removeEventListener('characteristicvaluechanged', handleData);
        characteristic = null;
    }
    
    if (device) {
        device.removeEventListener('gattserverdisconnected', onDisconnect);
        device.gatt?.disconnect().catch(() => {});
        device = null;
    }
    
    connectBtn.textContent = 'Connecter l\'appareil';
    updateStatus('Déconnecté', 'disconnected');
}

function onDisconnect() {
    logDebug('Déconnexion détectée');
    resetConnection();
}

// Vérification compatibilité Web Bluetooth
document.addEventListener('DOMContentLoaded', () => {
    if (!navigator.bluetooth) {
        updateStatus('Erreur: Bluetooth non supporté', 'error');
        connectBtn.disabled = true;
    }
});