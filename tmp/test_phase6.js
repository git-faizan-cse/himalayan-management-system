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

async function testPhase6() {
  console.log('--- Testing Phase 6 (Approvals Flow) ---');
  try {
    const email = `future_${Date.now()}@example.com`;
    const username = `future_${Date.now()}`;
    const businessName = `Future Corp ${Date.now()}`;

    // 1. PUBLIC REGISTRATION (Should be PENDING)
    console.log('\n[TEST 1] Public Registration (Should default to PENDING)');
    const reg = await req('/api/auth/register', 'POST', {
      businessName,
      ownerName: 'Future Owner',
      email,
      username,
      password: 'password123'
    });
    console.log('Registration Status:', reg.status);
    if (reg.status !== 201) return console.log('Registration failed.');

    // 2. ATTEMPT LOGIN AS PENDING USER (Should be Blocked)
    console.log('\n[TEST 2] Logging in as PENDING user (Should fail with 403)');
    const loginFail = await req('/api/auth/login', 'POST', {
      email,
      password: 'password123'
    });
    console.log('Login attempt status:', loginFail.status);
    console.log('Response Error:', loginFail.data?.error);
    if (loginFail.status !== 403) return console.log('FAIL: Pending user was not blocked.');
    console.log('✅ PENDING block verified.');

    // 3. SUPER ADMIN MANUAL CREATION (Should be ACTIVE)
    console.log('\n[TEST 3] Super Admin Manually Creating Tenant (Should be ACTIVE)');
    // First login as Super Admin
    const saLogin = await req('/api/auth/login', 'POST', { email: 'admin@himalayan.local', password: 'password123' });
    const saCookie = saLogin.cookie;
    
    if (!saCookie) return console.log('Super Admin login failed.', saLogin.data);

    const manualEmail = `manual_${Date.now()}@corp.com`;
    const manualCreate = await req('/api/super-admin/tenants/create', 'POST', {
      company_name: 'Manual Corp',
      admin_name: 'Manual Boss',
      admin_email: manualEmail,
      admin_username: `manual_${Date.now()}`,
      admin_password: 'password123'
    }, saCookie);

    console.log('Manual Create Status:', manualCreate.status);
    if (manualCreate.status !== 201) return console.log('Manual creation failed.', manualCreate.data);

    // 4. ATTEMPT LOGIN AS MANUALLY CREATED USER (Should Succeed)
    console.log('\n[TEST 4] Logging in as manually created user (Should succeed)');
    const manualLogin = await req('/api/auth/login', 'POST', {
      email: manualEmail,
      password: 'password123'
    });
    console.log('Login attempt status:', manualLogin.status);
    if (manualLogin.status !== 200 || !manualLogin.cookie) return console.log('FAIL: Manually created user could not log in.');
    console.log('✅ Manual active creation verified.');

    console.log('\n--- ALL APPROVAL TESTS PASSED ---');

  } catch(e) {
    console.error('Test script error:', e.message);
  }
}

testPhase6();
