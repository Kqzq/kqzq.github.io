const UUID = {
    SERVICE: '550e8400-e29b-41d4-a716-446655440000',
    CHARACTERISTIC: '550e8400-e29b-41d4-a716-446655440001'
};

class BLEManager {
    constructor() {
        this.device = null;
        this.characteristic = null;
        this.retryCount = 0;
    }

    async connect() {
        try {
            this.device = await navigator.bluetooth.requestDevice({
                filters: [{ name: 'GreenTrack-Pro', services: [UUID.SERVICE] }],
                optionalServices: [UUID.SERVICE]
            });

            const server = await this.device.gatt.connect();
            const service = await server.getPrimaryService(UUID.SERVICE);
            this.characteristic = await service.getCharacteristic(UUID.CHARACTERISTIC);
            
            await this.characteristic.startNotifications();
            this.characteristic.addEventListener('characteristicvaluechanged', this.handleData);
            
            console.log('BLE : Connecté avec succès');
            return true;
            
        } catch (error) {
            console.error(`BLE : Erreur (Tentative ${++this.retryCount}) :`, error);
            if (this.retryCount < 3) {
                console.log('BLE : Nouvelle tentative...');
                return this.connect();
            }
            throw error;
        }
    }

    handleData(event) {
        const value = new TextDecoder().decode(event.target.value);
        console.log('BLE : Données reçues :', value);
        document.getElementById('uid').innerText = value;
    }

    async disconnect() {
        if (this.characteristic) {
            await this.characteristic.stopNotifications();
        }
        if (this.device?.gatt.connected) {
            await this.device.gatt.disconnect();
        }
    }
}

// Initialisation
const ble = new BLEManager();

document.getElementById('connectBtn').addEventListener('click', async () => {
    try {
        await ble.connect();
        document.getElementById('status').innerText = 'Connecté';
    } catch (error) {
        document.getElementById('status').innerText = 'Erreur : ' + error.message;
    }
});