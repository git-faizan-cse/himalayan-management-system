const http = require('http');

async function testCreate() {
  try {
    // 1. Login
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@himalayan.com', password: 'admin' }) // wait, password is admin123? Let me check seed.js. The default is 'admin123'
    });
    
    // Oh, fetch will not automatically store cookies in Node.js. Extract set-cookie.
    const cookieHeader = loginRes.headers.get('set-cookie');
    let cookie = '';
    if (cookieHeader) {
      cookie = cookieHeader.split(';')[0];
    }

    // 2. Fetch categories to get an ID
    const catRes = await fetch('http://localhost:3000/api/categories', {
      headers: { 'Cookie': cookie }
    });
    const categories = await catRes.json();
    const catId = categories.length > 0 ? categories[0].id : '';

    // 3. Create product
    const payload = {
      name: "Test API Product",
      category_id: catId,
      brand: "",
      sku_code: "",
      unit: "piece",
      purchase_price: 100, // wait UI sends number or string? It comes from FormData which is mostly strings but input type="number" gives string. Let's send 100.
      selling_price: 150,
      gst_percent: 18,
      current_stock: 0,
      min_stock_alert: 10
    };

    const createRes = await fetch('http://localhost:3000/api/products', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': cookie
      },
      body: JSON.stringify(payload)
    });
    
    const responseBody = await createRes.text();
    console.log("Create Response Status:", createRes.status);
    console.log("Create Response Body:", responseBody);
  } catch (error) {
    console.error("Script error:", error);
  }
}

testCreate();
