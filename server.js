const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const P = require('pino');

const app = express();
app.use(cors());
app.use(express.json());

// 1. ANIME PROXY
app.get('/api/anime/search', async (req, res) => {
    try {
        const response = await axios.get(`https://api.consumet.org/anime/gogoanime/${req.query.q}`);
        res.json(response.data);
    } catch (error) { res.status(500).json({ error: "Gagal anime" }); }
});

app.get('/api/anime/info', async (req, res) => {
    try {
        const response = await axios.get(`https://api.consumet.org/anime/gogoanime/info/${req.query.id}`);
        res.json(response.data);
    } catch (error) { res.status(500).json({ error: "Gagal info" }); }
});

app.get('/api/anime/watch', async (req, res) => {
    try {
        const response = await axios.get(`https://api.consumet.org/anime/gogoanime/watch/${req.query.id}`);
        res.json(response.data);
    } catch (error) { res.status(500).json({ error: "Gagal watch" }); }
});

// 2. WHATSAPP BUG SENDER
let activeSockets = {};

app.get('/api/wa/qr', async (req, res) => {
    try {
        const sessionId = 'qr_' + Date.now();
        const { state, saveCreds } = await useMultiFileAuthState(`./sessions/${sessionId}`);
        
        const sock = makeWASocket({ auth: state, printQRInTerminal: false, logger: P({ level: 'silent' }) });
        sock.ev.on('creds.update', saveCreds);
        activeSockets[sessionId] = sock;

        let isResponded = false;
        sock.ev.on('connection.update', async (update) => {
            const { qr } = update;
            if (qr && !isResponded) {
                isResponded = true;
                const qrImage = await QRCode.toDataURL(qr);
                res.json({ status: 'success', qr: qrImage, sessionId: sessionId });
            }
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. JALANIN SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server jalan di port ${PORT}`));
