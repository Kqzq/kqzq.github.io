// UUIDs de votre ESP32 (à vérifier !)
const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';

let device; // Référence au périphérique BLE
let characteristic; // Caractéristique pour les notifications

document.getElementById('connectBtn').addEventListener('click', async () => {
    try {
        if (!device) {
            // Demande à l'utilisateur de sélectionner le périphérique
            device = await navigator.bluetooth.requestDevice({
                filters: [{ name: 'ESP32-RFID-Reader' }],
                optionalServices: [SERVICE_UUID]
            });

            // Connexion au périphérique
            const server = await device.gatt.connect();
            updateStatus('Connecté - Recherche du service...');

            // Accès au service
            const service = await server.getPrimaryService(SERVICE_UUID);
            updateStatus('Service trouvé - Accès à la caractéristique...');

            // Accès à la caractéristique
            characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);
            
            // Abonnement aux notifications
            await characteristic.startNotifications();
            updateStatus('Connecté - En attente de badges...');

            // Écoute des changements
            characteristic.addEventListener('characteristicvaluechanged', handleData);
            
            // Gestion de la déconnexion
            device.addEventListener('gattserverdisconnected', onDisconnect);
        }
    } catch (error) {
        updateStatus('Erreur : ' + error.message);
        resetConnection();
    }
});

function handleData(event) {
    const value = new TextDecoder().decode(event.target.value);
    document.getElementById('uid').textContent = `Dernier UID : ${value}`;
}

function onDisconnect() {
    updateStatus('Déconnecté');
    resetConnection();
}

function updateStatus(text) {
    document.getElementById('status').textContent = 'Statut : ' + text;
}

function resetConnection() {
    if (characteristic) {
        characteristic.stopNotifications();
        characteristic = null;
    }
    device = null;
}

// Enregistrement du Service Worker pour la PWA
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(() => console.log('Service Worker enregistré'))
        .catch(err => console.log('Échec enregistrement SW :', err));
}