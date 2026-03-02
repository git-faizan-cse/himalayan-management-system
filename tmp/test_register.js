const http = require('http');

async function req(path, method, body, cookie = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    };
    if (cookie) headers['Cookie'] = cookie;

    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: headers
    }, (res) => {
      let setCookie = res.headers['set-cookie']?.find(c => c.startsWith('himalaya_session='));
      if (setCookie) setCookie = setCookie.split(';')[0];
      
      let resBody = '';
      res.on('data', chunk => resBody += chunk);
      res.on('end', () => {
        let json = {};
        try { json = JSON.parse(resBody); } catch(e){}
        resolve({ status: res.statusCode, cookie: setCookie, data: json });
      });
    });
    
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function test() {
  console.log('--- Testing Onboarding Flow ---');
  try {
    const email = `testuser_${Date.now()}@example.com`;
    const username = `testuser_${Date.now()}`;
    const businessName = `Test Business ${Date.now()}`;

    console.log('1. Registering new business:', businessName);
    const reg = await req('/api/auth/register', 'POST', {
      businessName,
      ownerName: 'Test Owner',
      email,
      username,
      password: 'password123'
    });
    
    console.log('Registration Response:', reg.status, reg.data);
    if (reg.status !== 201) return console.log('Registration failed.');

    console.log('\n2. Logging in with new credentials...');
    const login = await req('/api/auth/login', 'POST', {
      email,
      password: 'password123'
    });
    
    console.log('Login Response:', login.status, '(Cookie received:', !!login.cookie, ')');
    if (!login.cookie) return console.log('Login failed.');

    console.log('\n3. Fetching /auth/me for Sidebar Context...');
    const me = await req('/api/auth/me', 'GET', null, login.cookie);
    
    console.log('/api/auth/me Response:', me.status, me.data);
    if (me.data.tenantName === businessName) {
      console.log('\n✅ Onboarding Flow Verified! tenantName matches.');
    } else {
      console.log('\n❌ Onboarding Flow Failed. tenantName does not match.');
    }

  } catch(e) {
    console.error('Test script error:', e.message);
  }
}

test();
