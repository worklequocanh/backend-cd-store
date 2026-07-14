import axios from 'axios';

async function test() {
  try {
    const email = `test${Date.now()}@gmail.com`;
    // 1. Register
    console.log('Registering', email);
    const regRes = await axios.post('https://backend-cd-store.onrender.com/api/auth/register', {
      name: 'Test User',
      email: email,
      password: 'password123'
    });
    const token = regRes.data.data.token;
    const userId = regRes.data.data.user.id;
    console.log('Register success');

    // 2. Update profile
    console.log('Updating profile');
    const updateRes = await axios.patch(`https://backend-cd-store.onrender.com/api/users/${userId}`, {
      name: 'Test User Updated'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Update success', updateRes.data.data.name);

  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }
}

test();
