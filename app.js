const UUID = {
    SERVICE: '12345678-1234-5678-1234-56789abcdef0',
    CHARACTERISTIC: 'abcdef00-1234-5678-1234-56789abcdef0'
};

let device;
let characteristic;

// Connexion au capteur RFID et remplissage du champ RFID TAG
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
            document.getElementById('rfidTag').value = uid;
            document.getElementById('clearRfid').classList.remove("hidden");
        });

    } catch (error) {
        console.error('Erreur:', error);
    }
}

// Suppression du scan RFID
document.getElementById('clearRfid').addEventListener('click', () => {
    document.getElementById('rfidTag').value = "";
    document.getElementById('clearRfid').classList.add("hidden");
});

// Récupération GPS
document.getElementById('getLocationBtn').addEventListener('click', () => {
    navigator.geolocation.getCurrentPosition(position => {
        document.getElementById('gpsLocation').value = 
            `Lat: ${position.coords.latitude}, Lng: ${position.coords.longitude}`;
    }, () => alert("Impossible d'obtenir la localisation."));
});

// Capture photo via la caméra
document.getElementById('photoBtn').addEventListener('click', () => {
    document.getElementById('treePhoto').click();
});

document.getElementById('treePhoto').addEventListener('change', function(event) {
    if (event.target.files.length > 0) {
        let src = URL.createObjectURL(event.target.files[0]);
        document.getElementById('photoPreview').src = src;
        document.getElementById('photoPreview').classList.remove("hidden");
        document.getElementById('clearPhoto').classList.remove("hidden");
    }
});

// Suppression de la photo
document.getElementById('clearPhoto').addEventListener('click', () => {
    document.getElementById('treePhoto').value = "";
    document.getElementById('photoPreview').classList.add("hidden");
    document.getElementById('clearPhoto').classList.add("hidden");
});

// Envoi des données
document.getElementById('submitBtn').addEventListener('click', () => {
    alert("Données prêtes à être envoyées !");
});

// Événement pour lancer le scan RFID
document.getElementById('scanBtn').addEventListener('click', connectBLE);
