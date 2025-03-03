const UUID = {
    SERVICE: '12345678-1234-5678-1234-56789abcdef0',
    CHARACTERISTIC: 'abcdef00-1234-5678-1234-56789abcdef0'
};

let device;
let characteristic;

document.getElementById('connectBtn').addEventListener('click', async () => {
    try {
        device = await navigator.bluetooth.requestDevice({
            filters: [{ 
                name: 'GreenTrack-V2',
                services: [UUID.SERVICE]
            }],
            optionalServices: [UUID.SERVICE]
        });

        const server = await device.gatt.connect();
        const service = await server.getPrimaryService(UUID.SERVICE);
        characteristic = await service.getCharacteristic(UUID.CHARACTERISTIC);

        await characteristic.startNotifications();
        
        characteristic.addEventListener('characteristicvaluechanged', event => {
            const decoder = new TextDecoder();
            const uid = decoder.decode(event.target.value);
            document.getElementById('uid').textContent = uid;
            document.getElementById('status').className = 'connected';
            document.getElementById('status').textContent = `Connecté - ${uid}`;
        });

    } catch (error) {
        console.error('Erreur:', error);
        document.getElementById('status').className = 'disconnected';
        document.getElementById('status').textContent = 'Erreur: ' + error.message;
    }
});