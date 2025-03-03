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
            document.getElementById('lastUid').textContent = uid;
            document.getElementById('statusLed').className = "w-4 h-4 rounded-full bg-green-500";
            document.getElementById('statusText').textContent = `Connecté - UID: ${uid}`;
            
            let history = document.getElementById("history");
            let newItem = document.createElement("div");
            newItem.className = "p-2 bg-emerald-100 rounded-md shadow-sm";
            newItem.textContent = uid;
            history.prepend(newItem);
        });

        document.getElementById("connectBtn").classList.add("hidden");
        document.getElementById("disconnectBtn").classList.remove("hidden");

    } catch (error) {
        console.error('Erreur:', error);
        document.getElementById('statusLed').className = "w-4 h-4 rounded-full bg-red-500";
        document.getElementById('statusText').textContent = 'Erreur: ' + error.message;
    }
}

function disconnectBLE() {
    if (device && device.gatt.connected) {
        device.gatt.disconnect();
        document.getElementById("connectBtn").classList.remove("hidden");
        document.getElementById("disconnectBtn").classList.add("hidden");
        document.getElementById('statusLed').className = "w-4 h-4 rounded-full bg-gray-300";
        document.getElementById('statusText').textContent = "Déconnecté.";
    }
}

document.getElementById('connectBtn').addEventListener('click', connectBLE);
document.getElementById('disconnectBtn').addEventListener('click', disconnectBLE);
