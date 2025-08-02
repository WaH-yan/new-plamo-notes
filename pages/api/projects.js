import { query } from '../../lib/db';

export default async function handler(req, res) {
  // GET - Fetch projects
  if (req.method === 'GET') {
    const { user_id } = req.query;
    
    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    try {
      // Get projects
      const projects = await query(
        'SELECT * FROM projects WHERE user_id = $1 ORDER BY created_date DESC',
        [user_id]
      );

      // For each project, get criteria, tags, and logbook entries
      const projectsWithDetails = await Promise.all(projects.map(async (project) => {
        const criteria = await query(
          'SELECT * FROM project_criteria WHERE project_id = $1',
          [project.id]
        );

        const tags = await query(
          'SELECT * FROM project_tags WHERE project_id = $1',
          [project.id]
        );

        const logbook = await query(
          'SELECT * FROM project_logbook WHERE project_id = $1 ORDER BY date DESC',
          [project.id]
        );

        return {
          ...project,
          criteria,
          tags: tags.map(tag => tag.tag),
          logbook
        };
      }));

      return res.status(200).json({ projects: projectsWithDetails });
    } catch (error) {
      console.error('Error fetching projects:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  // POST - Create new project
  else if (req.method === 'POST') {
    const { user_id, name, description, category, criteria, tags, plan_to_complete } = req.body;

    if (!user_id || !name) {
      return res.status(400).json({ error: 'User ID and project name are required' });
    }

    try {
      // Begin transaction
      await query('BEGIN');

      // Insert project
      const projectResult = await query(
        'INSERT INTO projects (user_id, name, description, category, plan_to_complete) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [user_id, name, description, category, plan_to_complete]
      );

      const project = projectResult[0];

      // Insert criteria
      if (criteria && criteria.length > 0) {
        for (const criteriaText of criteria) {
          await query(
            'INSERT INTO project_criteria (project_id, criteria_text) VALUES ($1, $2)',
            [project.id, criteriaText]
          );
        }
      }

      // Insert tags
      if (tags && tags.length > 0) {
        for (const tag of tags) {
          await query(
            'INSERT INTO project_tags (project_id, tag) VALUES ($1, $2)',
            [project.id, tag]
          );
        }
      }

      // Commit transaction
      await query('COMMIT');

      return res.status(201).json({ project });
    } catch (error) {
      // Rollback on error
      await query('ROLLBACK');
      console.error('Error creating project:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  // PUT - Update project
  else if (req.method === 'PUT') {
    const { id, user_id, name, description, category, status, progress, completed_criteria, plan_to_complete } = req.body;

    if (!id || !user_id) {
      return res.status(400).json({ error: 'Project ID and User ID are required' });
    }

    try {
      // Verify project belongs to user
      const projectCheck = await query(
        'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
        [id, user_id]
      );

      if (projectCheck.length === 0) {
        return res.status(403).json({ error: 'Project not found or not authorized' });
      }

      // Begin transaction
      await query('BEGIN');

      // Update project
      await query(
        'UPDATE projects SET name = $1, description = $2, category = $3, status = $4, progress = $5, plan_to_complete = $6 WHERE id = $7',
        [name, description, category, status, progress, plan_to_complete, id]
      );

      // Update criteria completion status
      await query('UPDATE project_criteria SET is_completed = false WHERE project_id = $1', [id]);

      if (completed_criteria && completed_criteria.length > 0) {
        for (const criteriaId of completed_criteria) {
          await query(
            'UPDATE project_criteria SET is_completed = true WHERE project_id = $1 AND id = $2',
            [id, criteriaId]
          );
        }
      }

      // Commit transaction
      await query('COMMIT');

      return res.status(200).json({ success: true });
    } catch (error) {
      // Rollback on error
      await query('ROLLBACK');
      console.error('Error updating project:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  // DELETE - Delete project
  else if (req.method === 'DELETE') {
    const { id, user_id } = req.query;

    if (!id || !user_id) {
      return res.status(400).json({ error: 'Project ID and User ID are required' });
    }

    try {
      // Verify project belongs to user
      const projectCheck = await query(
        'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
        [id, user_id]
      );

      if (projectCheck.length === 0) {
        return res.status(403).json({ error: 'Project not found or not authorized' });
      }

      // Delete project (cascade will handle related records)
      await query('DELETE FROM projects WHERE id = $1', [id]);

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting project:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}