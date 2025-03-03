const UUID = {
    SERVICE: '12345678-1234-5678-1234-56789abcdef0',
    CHARACTERISTIC: 'abcdef00-1234-5678-1234-56789abcdef0'
};

let device;
let characteristic;

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
            document.getElementById('uid').textContent = uid;
            document.getElementById('status').className = 'connected';
            document.getElementById('status').textContent = `Connecté - ${uid}`;
        });

        device.addEventListener('gattserverdisconnected', reconnectBLE);

    } catch (error) {
        console.error('Erreur:', error);
        document.getElementById('status').className = 'disconnected';
        document.getElementById('status').textContent = 'Erreur: ' + error.message;
    }
}

function disconnectBLE() {
    if (device && device.gatt.connected) {
        device.gatt.disconnect();
        document.getElementById('status').className = 'disconnected';
        document.getElementById('status').textContent = 'Déconnecté';
    }
}

function reconnectBLE() {
    console.log('Tentative de reconnexion...');
    setTimeout(connectBLE, 3000);
}

document.getElementById('connectBtn').addEventListener('click', connectBLE);
document.getElementById('disconnectBtn').addEventListener('click', disconnectBLE);
