const SERVICE_UUID = '91a48c04-1a7a-45f5-8d27-1d8f6c7a3b0c';
const CHARACTERISTIC_UUID = 'd3b7a8b1-6c1d-4f5a-9e2c-8a3b6d9e4f1a';

async function connectDevice() {
  try {
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ 
        name: 'GreenTrack-Node1',
        services: [SERVICE_UUID] 
      }],
      optionalServices: [SERVICE_UUID]
    });

    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(SERVICE_UUID);
    const characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);
    
    await characteristic.startNotifications();
    
    characteristic.addEventListener('characteristicvaluechanged', event => {
      const decoder = new TextDecoder();
      const uid = decoder.decode(event.target.value);
      console.log('UID reçu:', uid);
      updateUI(uid);
    });

  } catch (error) {
    console.error('Erreur:', error);
  }
}