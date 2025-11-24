// Load environment variables FIRST
import dotenv from 'dotenv';
dotenv.config();


import express from 'express';
import bodyParser from 'body-parser';
import { handleIncomingEmail } from './handlers/incomingEmail.js';


const app = express();
const PORT = process.env.PORT || 3000;

console.log("---- ENV CHECK ----");
console.log("PORT:", process.env.PORT);
console.log("MAILGUN KEY:", process.env.MAILGUN_API_KEY);
console.log("OPENAI KEY:", process.env.OPENAI_API_KEY);
console.log("DOMAIN:", process.env.MAILGUN_DOMAIN);
console.log("-------------------");



// Middleware to parse Mailgun webhook (x-www-form-urlencoded)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


// Health check
app.get('/', (req, res) => {
res.json({
status: 'running',
service: 'mailgun-auto-reply-bot',
timestamp: new Date().toISOString(),
});
});


// Mailgun webhook endpoint
app.post('/mailgun-webhook', async (req, res) => {
    console.log("test")
try {
// incoming handler will handle reply asynchronously, but respond quickly to Mailgun
console.log("test the data")
await handleIncomingEmail(req, res);
} catch (err) {
console.error('Error handling webhook:', err);
// Mailgun expects a 200/2xx when webhook processed — but if we have an error, still send 200 to avoid retries
// Optionally you might send 500 to force Mailgun to retry later.
res.status(500).json({ error: 'Failed to process webhook' });
}
});


app.listen(PORT, () => {
console.log('🚀 Mailgun Auto-Reply Bot Server Started');
console.log(`📡 Server running on port ${PORT}`);
console.log(`🔗 Webhook endpoint: POST http://localhost:${PORT}/mailgun-webhook`);
});