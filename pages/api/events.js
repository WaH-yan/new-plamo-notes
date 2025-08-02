import { query } from '../../lib/db';

export default async function handler(req, res) {
  // GET - Fetch events
  if (req.method === 'GET') {
    const { user_id } = req.query;
    
    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    try {
      const events = await query(
        'SELECT * FROM events WHERE user_id = $1 ORDER BY date ASC',
        [user_id]
      );

      return res.status(200).json({ events });
    } catch (error) {
      console.error('Error fetching events:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  // POST - Create new event
  else if (req.method === 'POST') {
    const { user_id, title, date, location, description, plan, type } = req.body;

    if (!user_id || !title || !date) {
      return res.status(400).json({ error: 'User ID, title, and date are required' });
    }

    try {
      const result = await query(
        'INSERT INTO events (user_id, title, date, location, description, plan, type) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [user_id, title, date, location, description, plan, type || 'user-created']
      );

      return res.status(201).json({ event: result[0] });
    } catch (error) {
      console.error('Error creating event:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  // DELETE - Delete event
  else if (req.method === 'DELETE') {
    const { id, user_id } = req.query;

    if (!id || !user_id) {
      return res.status(400).json({ error: 'Event ID and User ID are required' });
    }

    try {
      // Verify event belongs to user
      const eventCheck = await query(
        'SELECT id FROM events WHERE id = $1 AND user_id = $2',
        [id, user_id]
      );

      if (eventCheck.length === 0) {
        return res.status(403).json({ error: 'Event not found or not authorized' });
      }

      await query('DELETE FROM events WHERE id = $1', [id]);

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting event:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}