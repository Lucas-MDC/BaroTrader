import { Router } from 'express';
import path from 'path';

const router = Router();

router.get('/', (req, res) => {
  const srcRoot = req.app.get('SRC_ROOT');
  res.sendFile(path.join(srcRoot, 'public', 'pages', 'home.html'));

});

export default router;
