const { Client } = require('pg');

exports.handler = async (event) => {
  const client = new Client({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'ingepro', // Using the IngePro database
    port: 5432,
    ssl: {
      rejectUnauthorized: false // Allows self-signed certificates; use true in production with proper certificates
    }
  });

  try {
    await client.connect();

    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { work, project } = body;

    if (!work || !project) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing work or project' }),
      };
    }

    const result = await client.query(
      'INSERT INTO "WorkLog" (work, project) VALUES ($1, $2) RETURNING *',
      [work, project]
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Registro guardado exitosamente',
        data: result.rows[0],
      }),
    };
  } catch (err) {
    console.error('Database error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  } finally {
    await client.end();
  }
};
