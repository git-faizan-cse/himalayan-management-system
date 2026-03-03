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
    admin_username: `${prefix}_boss`,
    admin_password: 'password123',
    address: '123 Test St',
    gst_number: '22TESTGST001',
    phone: '+1 555-1234',
    email: email,
    invoice_prefix: 'ABC'
  }, saCookie);
  
  const login = await req('/api/auth/login', 'POST', { email, password: 'password123' });
  return { tenant: res.data.tenant, adminId: login.data.user.id, cookie: login.cookie };
}

async function testPhase8() {
  console.log('--- Testing Phase 8 (Custom Invoicing) ---');
  try {
    const saLogin = await req('/api/auth/login', 'POST', { email: 'admin@himalayan.local', password: 'password123' });
    const saCookie = saLogin.cookie;

    // 1. Create a tenant with a custom prefix 'ABC'
    console.log('\n[TEST 1] Creating new tenant with custom invoice_prefix: ABC...');
    const bizz = await createTenantAndLogin(saCookie, `bizz_${Date.now()}`);
    
    // 2. Add an inventory product
    const cat = await req('/api/categories', 'POST', { name: 'Test Cat' }, bizz.cookie);
    const prod = await req('/api/products', 'POST', {
      name: 'Test Prod', category_id: cat.data.id, unit: 'pc', purchase_price: 10, selling_price: 100, current_stock: 50
    }, bizz.cookie);

    // 3. Add a customer
    const cust = await req('/api/customers', 'POST', { name: 'Test Cust' }, bizz.cookie);

    // 4. Create an Invoice
    console.log('\n[TEST 2] Generating Sales Invoice...');
    const inv = await req('/api/sales', 'POST', {
      customer_id: cust.data.id,
      status: 'PAID',
      items: [{ product_id: prod.data.id, price_per_unit: 100, quantity: 1, gst_percent: 10 }]
    }, bizz.cookie);

    if (inv.status !== 201) return console.log('FAIL: Could not create invoice', inv.data);
    
    if (!inv.data.invoice_number.startsWith('ABC-')) {
      return console.log('FAIL: Invoice number did not use custom prefix.', inv.data.invoice_number);
    }
    console.log('✅ Invoice successfully generated with custom prefix:', inv.data.invoice_number);

    // 5. Fetch Invoice List to verify metadata injection
    console.log('\n[TEST 3] Fetching global sales list to verify Tenant metadata injection for PDF...');
    const list = await req('/api/sales', 'GET', null, bizz.cookie);
    const found = list.data[0];

    if (!found.tenant || found.tenant.gst_number !== '22TESTGST001') {
      return console.log('FAIL: Tenant metadata missing from sales GET.', found.tenant);
    }
    console.log('✅ Tenant metadata successfully injected:', Object.keys(found.tenant).join(', '));

    console.log('\n--- ALL INVOICING TESTS PASSED ---');

  } catch(e) {
    console.error('Test script error:', e.message);
  }
}

testPhase8();
