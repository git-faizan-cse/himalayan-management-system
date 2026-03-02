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

// Helper to manually create an active tenant and grab its cookie
async function createTenantAndLogin(saCookie, prefix) {
  const email = `${prefix}@test.com`;
  const res = await req('/api/super-admin/tenants/create', 'POST', {
    company_name: `${prefix} Corp`,
    admin_name: `${prefix} Boss`,
    admin_email: email,
    admin_username: `${prefix}_boss`,
    admin_password: 'password123'
  }, saCookie);
  
  const login = await req('/api/auth/login', 'POST', { email, password: 'password123' });
  return { tenant: res.data.tenant, adminId: login.data.user.id, cookie: login.cookie };
}

async function testPhase7() {
  console.log('--- Testing Phase 7 (User Isolation) ---');
  try {
    // 1. Get Super Admin Session
    const saLogin = await req('/api/auth/login', 'POST', { email: 'admin@himalayan.local', password: 'password123' });
    const saCookie = saLogin.cookie;

    // 2. Create Tenant A and Tenant B
    console.log('\nSetting up Tenant A and Tenant B...');
    const tenantA = await createTenantAndLogin(saCookie, `tenanta_${Date.now()}`);
    const tenantB = await createTenantAndLogin(saCookie, `tenantb_${Date.now()}`);
    
    // 3. Tenant A creates a new STAFF user
    console.log('\n[TEST 1] Tenant A creates a STAFF user');
    const createStaff = await req('/api/users', 'POST', {
      name: 'Staff A',
      email: `staffa_${Date.now()}@test.com`,
      password: 'password123',
      role: 'STAFF'
    }, tenantA.cookie);
    
    const staffId = createStaff.data.id;
    console.log('Created Staff ID:', staffId);
    if (!staffId) return console.log('Failed to create staff.', createStaff.data);

    // 4. Tenant B tries to see Tenant A's staff
    console.log('\n[TEST 2] Tenant B fetches users (Should NOT see Staff A)');
    const bUsers = await req('/api/users', 'GET', null, tenantB.cookie);
    const foundByB = bUsers.data.find(u => u.id === staffId);
    if (foundByB) return console.log('FAIL: Tenant B can see Tenant A users!', foundByB);
    console.log('✅ Tenant B cannot see Tenant A users.');

    // 5. Tenant B tries to DELETE Tenant A's staff
    console.log('\n[TEST 3] Tenant B attempts to DELETE Staff A (Should be blocked)');
    const deleteAttempt = await req(`/api/users/${staffId}`, 'DELETE', null, tenantB.cookie);
    console.log('Delete Status:', deleteAttempt.status);
    console.log('Response:', deleteAttempt.data);
    if (deleteAttempt.status !== 403) return console.log('FAIL: Tenant B was not blocked from deleting.');
    console.log('✅ Tenant B blocked from cross-tenant deletion.');

    // 6. Tenant A successfully deletes their own staff
    console.log('\n[TEST 4] Tenant A deletes their own Staff A (Should succeed)');
    const deleteOwn = await req(`/api/users/${staffId}`, 'DELETE', null, tenantA.cookie);
    console.log('Delete Status:', deleteOwn.status);
    if (deleteOwn.status !== 200) return console.log('FAIL: Tenant A could not delete their own user.');
    console.log('✅ Tenant A successfully managed their own data.');

    console.log('\n--- ALL USER ISOLATION TESTS PASSED ---');

  } catch(e) {
    console.error('Test script error:', e.message);
  }
}

testPhase7();
