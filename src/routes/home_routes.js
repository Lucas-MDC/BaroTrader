const { Router } = require('express');
const path = require('path');

const router = Router();

router.get('/', (req, res) => {
  const srcRoot = req.app.get('SRC_ROOT');
  res.sendFile(path.join(srcRoot, 'public', 'pages', 'account', 'logged.html'));
});

module.exports = router;
