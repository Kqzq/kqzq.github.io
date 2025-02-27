const SERVICE_UUID = '4aafc201-1fb5-459e-8fcc-c5c9c331914b';
const CHARACTERISTIC_UUID = '6eb5483e-36e1-4688-b7f5-ea07361b26a8';
const DEVICE_NAME = 'GreenTrack-01';
const MAX_HISTORY = 10;

let device = null;
let characteristic = null;
let history = [];

document.getElementById('connectBtn').addEventListener('click', async () => {
    try {
        if (!device) {
            updateStatus('Recherche de l\'appareil...', 'searching');
            
            device = await navigator.bluetooth.requestDevice({
                filters: [{ 
                    name: DEVICE_NAME,
                    services: [SERVICE_UUID]
                }],
                optionalServices: [SERVICE_UUID]
            });

            updateStatus('Connexion en cours...', 'connecting');
            
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
            
            updateStatus('Connecté - Prêt à scanner', 'connected');
            document.getElementById('btnText').textContent = 'Déconnecter';
        } else {
            await device.gatt.disconnect();
        }
    } catch (error) {
        console.error('Erreur:', error);
        resetConnection();
        updateStatus('Échec de connexion', 'error');
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
            <div class="flex items-center bg-green-50 p-3 rounded-lg border border-green-200">
                <i class="fas fa-hashtag text-green-400 mr-3"></i>
                <span class="font-mono text-green-700">${uid}</span>
                <span class="text-green-300 ml-auto">${new Date().toLocaleTimeString()}</span>
            </div>
        `)
        .join('');
}

function updateStatus(text, state) {
    const statusLed = document.getElementById('statusLed');
    const statusText = document.getElementById('statusText');
    
    statusText.textContent = text;
    statusLed.className = 'w-3 h-3 rounded-full';
    
    switch(state) {
        case 'connected':
            statusLed.classList.add('bg-green-500');
            break;
        case 'searching':
            statusLed.classList.add('bg-yellow-500', 'animate-pulse');
            break;
        case 'error':
            statusLed.classList.add('bg-red-500');
            break;
        default:
            statusLed.classList.add('bg-gray-400');
    }
}

function onDisconnect() {
    resetConnection();
    updateStatus('Déconnecté', 'disconnected');
    document.getElementById('btnText').textContent = 'Connecter l\'appareil';
}

function resetConnection() {
    if (characteristic) {
        characteristic.stopNotifications();
        characteristic = null;
    }
    device = null;
}

// Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
}