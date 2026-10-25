import dgram from 'node:dgram';

// A2S_INFO query packet: 0xFF 0xFF 0xFF 0xFF 'T' 'Source Engine Query' 0x00
const A2S_INFO = Buffer.from([
  0xFF, 0xFF, 0xFF, 0xFF,
  0x54, // 'T'
  0x53, 0x6F, 0x75, 0x72, 0x63, 0x65, 0x20, 0x45, 0x6E, 0x67, 0x69, 0x6E, 0x65, 0x20, 0x51, 0x75, 0x65, 0x72, 0x79, 0x00
]);

function testQuery(name, host, port) {
  return new Promise((resolve) => {
    const client = dgram.createSocket('udp4');
    let responded = false;
    const timer = setTimeout(() => {
      if (!responded) {
        client.close();
        console.log(`[-] ${name} (${host}:${port}) -> TIMEOUT (No A2S response)`);
        resolve(false);
      }
    }, 4000);

    client.on('message', (msg) => {
      responded = true;
      clearTimeout(timer);
      client.close();
      console.log(`[+] ${name} (${host}:${port}) -> A2S SUCCESS! Response length: ${msg.length} bytes, Header: 0x${msg[4]?.toString(16)}`);
      resolve(true);
    });

    client.send(A2S_INFO, port, host, (err) => {
      if (err) {
        clearTimeout(timer);
        client.close();
        console.log(`[-] ${name} (${host}:${port}) Send error: ${err.message}`);
        resolve(false);
      }
    });
  });
}

async function run() {
  console.log('--- TEST A2S QUERY PROTOCOL (Steam) ---');
  await testQuery('Local Query Port 16261', '127.0.0.1', 16261);
  await testQuery('Local RakNet Port 16262', '127.0.0.1', 16262);
  await testQuery('Playit Query Port 63854', '147.185.221.215', 63854);
  await testQuery('Playit RakNet Port 63855', '147.185.221.215', 63855);
}

run();
