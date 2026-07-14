import axios from 'axios';

const baseURL = 'https://backend-cd-store.onrender.com';
const testEmail = 'anhlq1208@gmail.com';

async function testEmails() {
  console.log('Testing Forgot Password API...');
  try {
    const res = await axios.post(`${baseURL}/api/auth/forgot-password`, {
      email: testEmail
    });
    console.log('Forgot Password response:', res.data);
  } catch (err) {
    console.error('Forgot Password error:', err.response?.data || err.message);
  }
}

testEmails();
