const UUID = {
    SERVICE: '12345678-1234-5678-1234-56789abcdef0',
    CHARACTERISTIC: 'abcdef00-1234-5678-1234-56789abcdef0'
};

let device;
let characteristic;

// Connexion Bluetooth
async function connectBLE() {
    try {
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
            document.getElementById('lastUid').textContent = uid;
            addToHistory(uid);
            updateStatus(true);
        });

        device.addEventListener('gattserverdisconnected', () => {
            updateStatus(false);
            reconnectBLE();
        });

        updateStatus(true);

    } catch (error) {
        console.error('Erreur:', error);
        updateStatus(false);
    }
}

// Déconnexion Bluetooth
function disconnectBLE() {
    if (device && device.gatt.connected) {
        device.gatt.disconnect();
    }
    updateStatus(false);
}

// Reconnexion automatique
function reconnectBLE() {
    console.log('Tentative de reconnexion...');
    setTimeout(connectBLE, 3000);
}

// Mise à jour du statut de connexion
function updateStatus(connected) {
    document.getElementById('statusLed').className = connected ? "w-4 h-4 rounded-full bg-green-500 animate-pulse" : "w-4 h-4 rounded-full bg-gray-300";
    document.getElementById('statusText').textContent = connected ? "Connecté" : "En attente de connexion...";
    document.getElementById('connectBtn').classList.toggle("hidden", connected);
    document.getElementById('disconnectBtn').classList.toggle("hidden", !connected);
}

// Ajouter à l’historique des scans
function addToHistory(uid) {
    const history = document.getElementById("history");
    const entry = document.createElement("div");
    entry.className = "bg-emerald-100 text-emerald-800 p-2 rounded-lg text-center";
    entry.textContent = uid;
    history.prepend(entry);
}

document.getElementById('connectBtn').addEventListener('click', connectBLE);
document.getElementById('disconnectBtn').addEventListener('click', disconnectBLE);
