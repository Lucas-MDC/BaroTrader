import dotenv from 'dotenv';
import express from 'express';
import routes from './routes.js';

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(routes);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
