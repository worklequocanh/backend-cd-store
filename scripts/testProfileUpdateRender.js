import axios from 'axios';

async function test() {
  try {
    const loginRes = await axios.post('https://backend-cd-store.onrender.com/api/auth/login', {
      email: 'anhlq1208@gmail.com',
      password: '123456'
    });
    const token = loginRes.data.data.token;
    const userId = loginRes.data.data.user.id;
    console.log('Login success');

    const updateRes = await axios.patch(`https://backend-cd-store.onrender.com/api/users/${userId}`, {
      name: 'Anh Le Quoc Updated 6'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Update success', updateRes.data.data.name);
  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }
}

test();
