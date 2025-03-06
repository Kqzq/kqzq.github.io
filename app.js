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
        });

    } catch (error) {
        console.error('Erreur:', error);
    }
}

// Récupération GPS
document.getElementById('getLocationBtn').addEventListener('click', () => {
    navigator.geolocation.getCurrentPosition(position => {
        document.getElementById('gpsLocation').value = 
            `Lat: ${position.coords.latitude}, Lng: ${position.coords.longitude}`;
    }, () => alert("Impossible d'obtenir la localisation."));
});

// Envoi des données (simulation pour base de données externe)
document.getElementById('submitBtn').addEventListener('click', () => {
    const treeData = {
        rfidTag: document.getElementById('rfidTag').value,
        species: document.getElementById('treeType').value,
        height: document.getElementById('treeHeight').value,
        plantingDate: document.getElementById('treeDate').value,
        location: document.getElementById('gpsLocation').value
    };

    console.log("Données envoyées :", JSON.stringify(treeData, null, 2));
    alert("Données prêtes à être envoyées !");
});

// Événement pour lancer le scan RFID
document.getElementById('scanBtn').addEventListener('click', connectBLE);
