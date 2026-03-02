const http = require('http');
const fs = require('fs');

const logStream = fs.createWriteStream('tmp/out.log', { flags: 'w' });
console.log = function(...args) { logStream.write(args.join(' ') + '\n'); };
console.error = function(...args) { logStream.write('ERROR: ' + args.join(' ') + '\n'); };

async function login(email, password) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ email, password });
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }, (res) => {
      console.log('Login Set-Cookie header:', res.headers['set-cookie']);
      let cookie = res.headers['set-cookie']?.find(c => c.startsWith('himalaya_session='));
      if (cookie) cookie = cookie.split(';')[0];
      
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let json = {};
        try { json = JSON.parse(body); } catch(e){}
        resolve({ status: res.statusCode, cookie, data: json });
      });
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function fetchAPI(path, cookie) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {
        'Cookie': cookie || ''
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let json = {};
        try { json = JSON.parse(body); } catch(e){}
        resolve({ status: res.statusCode, data: json });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function test() {
  console.log('--- Testing API Isolation ---');
  try {
    const c1 = await login('admin@himalayan.local', 'password123');
    console.log('[Himalayan Login]', c1.status, c1.cookie);
    
    const c2 = await login('owner@global.local', 'password123');
    console.log('[Global Login]', c2.status, c2.cookie);
    
    if (!c1.cookie || !c2.cookie) {
      console.log('Failed to get cookies');
      return;
    }

    const p1 = await fetchAPI('/api/products', c1.cookie);
    console.log('- Himalayan Products:', p1.status, `| Count: ${Array.isArray(p1.data) ? p1.data.length : 'N/A'}`);
    
    const p2 = await fetchAPI('/api/products', c2.cookie);
    console.log('- Global Products:', p2.status, `| Count: ${Array.isArray(p2.data) ? p2.data.length : 'N/A'}`);
    
    const d1 = await fetchAPI('/api/dashboard', c1.cookie);
    console.log('- Himalayan Dashboard Status:', d1.status);
    
    const d2 = await fetchAPI('/api/dashboard', c2.cookie);
    console.log('- Global Dashboard Status:', d2.status);

    const s1 = await fetchAPI('/api/sales', c1.cookie);
    console.log('- Himalayan Sales Status:', s1.status, `| Count: ${Array.isArray(s1.data) ? s1.data.length : 'N/A'}`);

    console.log('--- Isolation Tests Completed ---');
  } catch(e) {
    console.error('Test Failed:', e.message);
  }
}

test();

