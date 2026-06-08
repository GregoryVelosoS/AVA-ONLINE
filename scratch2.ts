const net = require('net');
const client = new net.Socket();
client.connect(23300, 'ava-online-aluno-74b2.c.aivencloud.com', () => {
    console.log('Connected');
    client.destroy();
});
client.on('error', (err) => {
    console.error('Connection error:', err);
});
client.on('timeout', () => {
    console.error('Connection timeout');
    client.destroy();
});
