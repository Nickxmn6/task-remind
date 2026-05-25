async function testOneSignal() {
  const response = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic os_v2_app_5qfj4ezdzje7hm2cs6ebcxjz4s5jqhrp4f3udhfogbbgntc7gxjbvtt4mww7aoepu5rowhhrkvw4h5563nup4o4miyq4udao7e3sc3y'
    },
    body: JSON.stringify({
      app_id: 'ec0a9e13-23ca-49f3-b342-9788115d39e4',
      included_segments: ['Subscribed Users'],
      headings: { en: 'Test Title' },
      contents: { en: 'Test Message' }
    })
  });

  const data = await response.json();
  console.log('Status:', response.status);
  console.log('Data:', data);
}

testOneSignal();
