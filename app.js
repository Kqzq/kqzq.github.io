const UUID = {
    SERVICE: '12345678-1234-5678-1234-56789abcdef0',
    CHARACTERISTIC: 'abcdef00-1234-5678-1234-56789abcdef0'
};

let device;
let characteristic;

// Connexion au capteur RFID
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
            document.getElementById('statusText').textContent = `Identifié - UID: ${uid}`;
        });

    } catch (error) {
        console.error('Erreur:', error);
    }
}

// Récupération GPS
document.getElementById('getLocationBtn').addEventListener('click', () => {
    navigator.geolocation.getCurrentPosition(position => {
        document.getElementById('latitude').textContent = position.coords.latitude;
        document.getElementById('longitude').textContent = position.coords.longitude;
    }, () => alert("Impossible d'obtenir la localisation."));
});

document.getElementById('connectBtn').addEventListener('click', connectBLE);
