import dotenv from "dotenv";
dotenv.config();
import formData from 'form-data';
import Mailgun from 'mailgun.js';


const mg = new Mailgun(formData);


// Create client using environment variables
const client = mg.client({
username: 'api',
key: process.env.MAILGUN_API_KEY,
});


/**
* Send an email through Mailgun
* @param {{to: string, subject: string, text: string}} opts
*/
export async function sendEmail({ to, subject, text }) {
if (!process.env.MAILGUN_DOMAIN) {
throw new Error('MAILGUN_DOMAIN not configured');
}


try {
const result = await client.messages.create(process.env.MAILGUN_DOMAIN, {
from: `Auto Reply <noreply@${process.env.MAILGUN_DOMAIN}>`,
to,
subject,
text,
});
console.log('Mailgun send result:', result);
return result;
} catch (err) {
console.error('Mailgun send error:', err);
throw err;
}
}