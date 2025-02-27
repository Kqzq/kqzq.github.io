const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
const MAX_HISTORY = 10;

let device = null;
let characteristic = null;
let history = [];

document.getElementById('connectBtn').addEventListener('click', async () => {
    try {
        if (!device) {
            updateStatus('Recherche en cours...', 'searching');
            
            device = await navigator.bluetooth.requestDevice({
                filters: [{ 
                    name: 'ESP32-RFID-Reader',
                    services: [SERVICE_UUID] 
                }],
                optionalServices: [SERVICE_UUID]
            });

            updateStatus('Connexion...', 'connecting');
            
            const server = await device.gatt.connect();
            const service = await server.getPrimaryService(SERVICE_UUID);
            characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);
            
            await characteristic.startNotifications();
            
            characteristic.addEventListener('characteristicvaluechanged', event => {
                const decoder = new TextDecoder('utf-8');
                const uid = decoder.decode(event.target.value);
                updateUID(uid);
                addToHistory(uid);
            });

            device.addEventListener('gattserverdisconnected', onDisconnect);
            
            updateStatus('Connecté', 'connected');
            document.getElementById('btnText').textContent = 'Déconnecter';
        } else {
            await device.gatt.disconnect();
        }
    } catch (error) {
        console.error('Erreur:', error);
        resetConnection();
        updateStatus('Erreur de connexion', 'error');
    }
});

function updateUID(uid) {
    const uidElement = document.getElementById('lastUid');
    uidElement.textContent = uid;
    uidElement.classList.add('animate-pulse');
    setTimeout(() => uidElement.classList.remove('animate-pulse'), 500);
}

function addToHistory(uid) {
    history = [uid, ...history.slice(0, MAX_HISTORY - 1)];
    const historyElement = document.getElementById('history');
    historyElement.innerHTML = history
        .map(uid => `
            <div class="flex items-center bg-white p-3 rounded shadow-sm">
                <i class="fas fa-tag text-gray-400 mr-3"></i>
                <span class="font-mono text-gray-700">${uid}</span>
            </div>
        `)
        .join('');
}

function updateStatus(text, state) {
    const statusLed = document.getElementById('statusLed');
    const statusText = document.getElementById('statusText');
    
    statusText.textContent = text;
    statusLed.className = 'w-4 h-4 rounded-full animate-pulse';
    
    switch(state) {
        case 'connected':
            statusLed.classList.add('bg-emerald-500');
            statusLed.classList.remove('animate-pulse');
            break;
        case 'searching':
            statusLed.classList.add('bg-emerald-300');
            break;
        case 'error':
            statusLed.classList.add('bg-red-400');
            break;
        default:
            statusLed.classList.add('bg-emerald-200');
    }
}

// Modifier l'affichage des UID avec des icônes feuilles
function addToHistory(uid) {
    history = [uid, ...history.slice(0, MAX_HISTORY - 1)];
    const historyElement = document.getElementById('history');
    historyElement.innerHTML = history
        .map(uid => `
            <div class="flex items-center bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                <i class="fas fa-fingerprint text-emerald-400 mr-3"></i>
                <span class="font-mono text-emerald-700">${uid}</span>
                <i class="fas fa-leaf text-emerald-300 ml-auto"></i>
            </div>
        `)
        .join('');
}

function onDisconnect() {
    resetConnection();
    updateStatus('Déconnecté', 'disconnected');
    document.getElementById('btnText').textContent = 'Se connecter';
}

function resetConnection() {
    if (characteristic) {
        characteristic.stopNotifications();
        characteristic = null;
    }
    device = null;
}

// Service Worker (même code que précédemment)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
}