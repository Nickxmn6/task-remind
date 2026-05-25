export default async function handler(req, res) {
  // Hanya izinkan method POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { title, message, url } = req.body;

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        // Mengambil Kunci Rahasia dari Environment Variables di Vercel
        'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify({
        app_id: 'ec0a9e13-23ca-49f3-b342-9788115d39e4',
        included_segments: ['Subscribed Users'],
        headings: { en: title },
        contents: { en: message },
        url: url
      })
    });

    const data = await response.json();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error sending notification:', error);
    return res.status(500).json({ success: false, error: 'Failed to send notification' });
  }
}
