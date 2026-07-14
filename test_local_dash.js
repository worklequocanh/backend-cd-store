import jwt from 'jsonwebtoken';

(async () => {
  try {
    // Generate a valid admin token manually
    const token = jwt.sign(
      { id: '6a562a473a8db00024088677', role: 'admin' }, // faking admin role
      'your-secret-key-change-this',
      { expiresIn: '1h' }
    );

    const res = await fetch('http://localhost:5000/api/admin/dashboard', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));

  } catch (err) {
    console.error(err);
  }
})();
