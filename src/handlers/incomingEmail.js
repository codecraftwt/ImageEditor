import { generateReply } from '../openai.js';
import { sendEmail } from '../mailgun.js';


/**
* Handle Mailgun inbound webhook
* Mailgun sends form-encoded fields. We expect at least: sender, subject, 'body-plain'
*/
export async function handleIncomingEmail(req, res) {
console.log("Inside incoming email handler");
try {
// Mailgun sends x-www-form-urlencoded body. body-parser has parsed it for us.
const { sender, subject, 'body-plain': bodyPlain } = req.body; // destructuring won't work with hyphen key directly


// Safer extraction
const rawBody = req.body['body-plain'] || req.body['body-html'] || req.body['stripped-text'] || req.body['body'] || '';
const rawSender = req.body['sender'] || req.body['From'] || req.body['from'] || '';
const rawSubject = req.body['subject'] || '(no subject)';


// Extract email address from sender string: "Name <email@domain.com>"
const senderEmailMatch = rawSender.match(/<([^>]+)>/);
const senderEmail = senderEmailMatch ? senderEmailMatch[1] : rawSender.trim();


console.log('Inbound email from:', senderEmail);
console.log('Subject:', rawSubject);


// Generate a reply using OpenAI
const aiInputText = `Subject: ${rawSubject}\n\n${rawBody}`;
const replyText = await generateReply(aiInputText);


// Construct reply email
const replySubject = `Re: ${rawSubject}`;
const fromAddress = `Auto Reply <noreply@${process.env.MAILGUN_DOMAIN}>`;


// Send reply via Mailgun
const sendResult = await sendEmail({
to: senderEmail,
subject: replySubject,
text: replyText,
});


console.log('Reply sent to:', senderEmail, 'result:', sendResult?.id || sendResult);


// Respond to Mailgun quickly
res.status(200).json({ message: 'Processed', mailgun: sendResult });
} catch (err) {
console.error('Error in incomingEmail handler:', err);
// Don't crash the process; let Mailgun decide whether to retry based on status
res.status(500).json({ error: 'Failed to process incoming email' });
}
}