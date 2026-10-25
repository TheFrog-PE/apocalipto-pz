import dgram from 'node:dgram';

const RAKNET_PING = Buffer.from([
  0x01, // ID_UNCONNECTED_PING
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, // pingID
  0x00, 0xff, 0xff, 0x00, 0xfe, 0xfe, 0xfe, 0xfe, // offline ping magic
  0xfd, 0xfd, 0xfd, 0xfd, 0x12, 0x34, 0x56, 0x78,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02
]);

function testPort(name, host, port) {
  return new Promise((resolve) => {
    const client = dgram.createSocket('udp4');
    let responded = false;
    const timeout = setTimeout(() => {
      if (!responded) {
        client.close();
        console.log(`[-] ${name} (${host}:${port}) -> TIMEOUT`);
        resolve(false);
      }
    }, 4000);

    client.on('message', (msg) => {
      responded = true;
      clearTimeout(timeout);
      client.close();
      const packetId = msg[0];
      console.log(`[+] ${name} (${host}:${port}) -> OK! Packet ID: 0x${packetId.toString(16)} (Length: ${msg.length} bytes)`);
      resolve(true);
    });

    client.send(RAKNET_PING, port, host, (err) => {
      if (err) {
        clearTimeout(timeout);
        client.close();
        console.log(`[-] ${name} (${host}:${port}) Send error: ${err.message}`);
        resolve(false);
      }
    });
  });
}

async function run() {
  console.log('--- TEST DE PROTOCOLO UDP RAKNET ---');
  await testPort('LOCAL PZ RAKNET', '127.0.0.1', 16262);
  await testPort('PLAYIT GAME TUNNEL', '147.185.221.215', 63855);
}

run();
