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

async function testPDFInjection() {
  console.log('--- Testing PDF Metadata Injection ---');
  try {
    const login = await req('/api/auth/login', 'POST', { email: 'admin@himalayan.local', password: 'password123' });
    const saCookie = login.cookie;
    
    // Get sales list
    const sales = await req('/api/sales', 'GET', null, saCookie);
    if(sales.status === 200 && sales.data.length > 0) {
       const invoiceId = sales.data[0].id;
       console.log('\n[TEST 1] Fetching single Sale invoice:', invoiceId);
       const singleSale = await req(`/api/sales/${invoiceId}`, 'GET', null, saCookie);
       if(singleSale.data.tenant && singleSale.data.tenant.company_name) {
           console.log('✅ Sales Invoice PDF payload contains Tenant metadata:', singleSale.data.tenant.company_name);
       } else {
           console.log('❌ FAIL: Sales Invoice PDF payload missing Tenant metadata!', singleSale.data);
       }
    } else {
       console.log('No sales invoices found to test, but endpoints modified.');
    }
    
    const pur = await req('/api/purchases', 'GET', null, saCookie);
    if(pur.status === 200 && pur.data.length > 0) {
       const purId = pur.data[0].id;
       console.log('\n[TEST 2] Fetching single Purchase Bill:', purId);
       const singlePur = await req(`/api/purchases/${purId}`, 'GET', null, saCookie);
       if(singlePur.data.tenant && singlePur.data.tenant.company_name) {
           console.log('✅ Purchase Bill PDF payload contains Tenant metadata:', singlePur.data.tenant.company_name);
       } else {
           console.log('❌ FAIL: Purchase Bill PDF payload missing Tenant metadata!', singlePur.data);
       }
    } else {
       console.log('No purchase bills found to test, but endpoints modified.');
    }

  } catch(e) {
    console.error('Test script error:', e.message);
  }
}

testPDFInjection();
