const UUID = {
    SERVICE: '4fafc201-1fb5-459e-8fcc-c5c9c331914b',
    CHARACTERISTIC: 'beb5483e-36e1-4688-b7f5-ea07361b26a8'
};

document.getElementById('connectBtn').addEventListener('click', async () => {
    try {
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ name: 'GreenTrack-ESP32', services: [UUID.SERVICE] }],
            optionalServices: [UUID.SERVICE]
        });

        const server = await device.gatt.connect();
        const service = await server.getPrimaryService(UUID.SERVICE);
        const characteristic = await service.getCharacteristic(UUID.CHARACTERISTIC);

        await characteristic.startNotifications();
        
        characteristic.addEventListener('characteristicvaluechanged', event => {
            const decoder = new TextDecoder();
            const uid = decoder.decode(event.target.value);
            document.getElementById('status').textContent = `UID reçu : ${uid}`;
        });

    } catch (error) {
        console.error('Erreur:', error);
        document.getElementById('status').textContent = 'Erreur : ' + error.message;
    }
});