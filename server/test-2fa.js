const API = 'http://localhost:5000/api';

async function test() {
  // 1. Login
  console.log('=== 1. Login ===');
  const loginRes = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'teshelin7@gmail.com', password: 'T35h1997%' }),
  });
  const loginData = await loginRes.json();
  console.log('Login response:', JSON.stringify(loginData));
  const token = loginData.token;
  console.log('Token obtained:', token ? token.substring(0, 30) + '...' : 'NONE');

  // 2. Setup 2FA
  console.log('\n=== 2. /2fa/setup ===');
  const setupRes = await fetch(`${API}/auth/2fa/setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });
  const setupData = await setupRes.json();
  console.log('Status:', setupRes.status);
  console.log('Secret (base32):', setupData.secret);

  // 3. Try WRONG code
  console.log('\n=== 3. /2fa/verify-setup with code "000000" (expect 400) ===');
  const wrongRes = await fetch(`${API}/auth/2fa/verify-setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ code: '000000' }),
  });
  const wrongData = await wrongRes.json();
  console.log('Status:', wrongRes.status);
  console.log('Body:', JSON.stringify(wrongData));

  // 4. Confirm token still valid
  console.log('\n=== 4. Confirm session intact (call /2fa/setup again) ===');
  const checkRes = await fetch(`${API}/auth/2fa/setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });
  console.log('Status:', checkRes.status, checkRes.status === 200 ? '(session intact!)' : '(BROKEN!)');

  // 5. Read server logs
  console.log('\n=== 5. Server console logs ===');
}

test().catch(console.error);
