import { Router } from 'express';
import { getDb, rowsToObjects } from '../db.js';

const router = Router();

router.get('/', async (_req, res) => {
  const db = await getDb();
  const types = rowsToObjects(
    db.exec('SELECT * FROM activity_types ORDER BY display_order')
  );
  res.json(types);
});

export default router;
