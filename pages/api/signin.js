import { query } from '../../lib/db';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const users = await query(
      'SELECT id, email, username, full_name AS name, password_hash FROM users WHERE email = $1',
      [email]
    );

    const user = users[0];

    if (user && await bcrypt.compare(password, user.password_hash)) {
      return res.status(200).json({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name
        }
      });
    } else {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Signin error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}