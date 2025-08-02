import { neon } from '@netlify/neon';

// Initialize neon SQL client
export const sql = neon();

// Helper function to execute SQL queries
export async function query(sqlQuery, params = []) {
  try {
    const result = await sql.query(sqlQuery, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}