const https = require('https');

const BASE_URL = 'https://script.google.com/macros/s/AKfycbwzBchO29z8hOOhDExK8Od8voS3YVUZBO4HKKImvuO_5jOHFwcThmDLtFzfCuWHeuYA/exec';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      // Handle redirect
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, (redirectRes) => {
          let data = '';
          redirectRes.on('data', chunk => data += chunk);
          redirectRes.on('end', () => resolve({ status: redirectRes.statusCode, body: data }));
        }).on('error', reject);
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('--- 1. Testing ping ---');
  const ping = await fetchUrl(`${BASE_URL}?action=ping`);
  console.log('ping response:', ping.status, ping.body);

  console.log('\n--- 2. Testing getRegistrationAvailability ---');
  const avail = await fetchUrl(`${BASE_URL}?action=getRegistrationAvailability`);
  console.log('avail response:', avail.status, avail.body);

  console.log('\n--- 3. Testing adminAuthCheck with VALID secret ---');
  const valid = await fetchUrl(`${BASE_URL}?action=adminAuthCheck&adminSecret=kheprix2k26_overseer_key`);
  console.log('valid response:', valid.status, valid.body);

  console.log('\n--- 4. Testing adminAuthCheck with WRONG secret ---');
  const wrong = await fetchUrl(`${BASE_URL}?action=adminAuthCheck&adminSecret=wrong_secret`);
  console.log('wrong response:', wrong.status, wrong.body);

  console.log('\n--- 5. Testing getRegistrations with NO secret ---');
  const noSecret = await fetchUrl(`${BASE_URL}?action=getRegistrations`);
  console.log('noSecret response:', noSecret.status, noSecret.body);
}

runTests().catch(console.error);
