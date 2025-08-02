import { query } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id, username, fullName, email } = req.body;

  if (!id || !username || !fullName || !email) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Check if email is already in use by another user
    const existingUsers = await query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email, id]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ error: 'Email already in use by another account' });
    }

    // Update user
    const result = await query(
      'UPDATE users SET username = $1, full_name = $2, email = $3 WHERE id = $4 RETURNING id, email, username, full_name AS name',
      [username, fullName, email, id]
    );

    if (result.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({
      user: {
        id: result[0].id,
        email: result[0].email,
        username: result[0].username,
        name: result[0].name
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}