import axios from 'axios';
let attempts = 0;
const interval = setInterval(async () => {
  attempts++;
  try {
    console.log(`Attempt ${attempts}...`);
    const res = await axios.get('https://backend-cd-store.onrender.com/api/admin/test-email?to=anhlq1208@gmail.com', { timeout: 10000 });
    console.log('SUCCESS:', res.data);
    clearInterval(interval);
  } catch (err) {
    console.log('FAILED:', err.response ? err.response.data : err.message);
  }
}, 5000);
