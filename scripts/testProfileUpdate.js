import axios from 'axios';

async function test() {
  try {
    // 1. login
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'anhlq1208@gmail.com',
      password: 'password123'
    });
    const token = loginRes.data.data.token;
    const userId = loginRes.data.data.user.id;

    console.log('Login success');

    // 2. update profile
    const updateRes = await axios.patch(`http://localhost:5000/api/users/${userId}`, {
      name: 'Anh Le Quoc Updated'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Update success', updateRes.data.data.name);
  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }
}

test();
