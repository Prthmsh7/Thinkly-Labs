const fs = require('fs');
const messages = [{ role: 'user', content: 'Plan a day trip to South Mumbai' }];
fetch('http://localhost:3000/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ messages })
}).then(r => r.json()).then(console.log).catch(console.error);
