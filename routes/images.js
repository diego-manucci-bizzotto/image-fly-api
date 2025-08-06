const express = require('express');
const multer = require('multer');
const { Pool } = require('pg');

const router = express.Router();
const upload = multer();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

async function removeOldImages() {
    try {
        await pool.query(
            "DELETE FROM images WHERE created_at < NOW() - INTERVAL '8 hours'"
        );
    } catch (err) {
        console.error('Failed to remove old images:', err);
    }
}

router.post('/', upload.single('image'), async (req, res) => {
    if (!req.file) return res.status(400).send('No image uploaded');

    await removeOldImages();

    const { originalname, mimetype, buffer } = req.file;

    try {
        const result = await pool.query(
            'INSERT INTO images (filename, mimetype, data) VALUES ($1, $2, $3) RETURNING id',
            [originalname, mimetype, buffer]
        );

        res.json({ id: result.rows[0].id });
    } catch (err) {
        console.error('DB insert error:', err);
        res.status(500).send('Failed to save image');
    }
});

router.get('/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
        return res.status(400).send('Invalid image id');
    }

    await removeOldImages();

    try {
        const result = await pool.query(
            'SELECT mimetype, data FROM images WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) return res.status(404).send('Image not found');

        const { mimetype, data } = result.rows[0];
        res.set('Content-Type', mimetype);
        res.send(data);
    } catch (err) {
        console.error('DB fetch error:', err);
        res.status(500).send('Failed to fetch image');
    }
});

router.delete('/cleanup', async (req, res) => {
    try {
        const result = await pool.query(
            "DELETE FROM images WHERE created_at < NOW() - INTERVAL '8 hours'"
        );
        res.json({ removed: result.rowCount });
    } catch (err) {
        console.error('Cleanup error:', err);
        res.status(500).send('Failed to cleanup images');
    }
});

module.exports = router;