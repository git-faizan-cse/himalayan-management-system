const http = require('http');

async function req(path, method, body, cookie = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    };
    if (cookie) headers['Cookie'] = cookie;

    const request = http.request({
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
    
    request.on('error', reject);
    if (data) request.write(data);
    request.end();
  });
}

async function test() {
  console.log('--- Testing Super Admin Logic ---');
  try {
    console.log('\n1. Logging in as Super Admin (admin@himalayan.local)...');
    const login = await req('/api/auth/login', 'POST', {
      email: 'admin@himalayan.local',
      password: 'password123'
    });
    
    const cookie = login.cookie;
    console.log('Login Response:', login.status, '(Role:', login.data?.user?.role, ')');
    if (!cookie) return console.log('Login failed.');

    console.log('\n2. Testing allowed route (/api/super-admin/tenants)...');
    const tenants = await req('/api/super-admin/tenants', 'GET', null, cookie);
    console.log('Status:', tenants.status, '| Total Tenants found:', Array.isArray(tenants.data) ? tenants.data.length : 'N/A');

    console.log('\n3. Testing blocked operational route (/api/sales)...');
    const sales = await req('/api/sales', 'GET', null, cookie);
    console.log('Sales Status:', sales.status, '| Response:', sales.data?.error || 'FAIL: Should be blocked');

    console.log('\n4. Testing blocked operational route (/api/products)...');
    const products = await req('/api/products', 'GET', null, cookie);
    console.log('Products Status:', products.status, '| Response:', products.data?.error || 'FAIL: Should be blocked');

    console.log('\nAll security tests complete.');

  } catch(e) {
    console.error('Test script error:', e.message);
  }
}

test();
