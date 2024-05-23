import express from "express";
import cors from "cors";

import path from "path";
import fs from "fs";

const app = express();
const port = 6511;

app.use(cors())

app.get('/', (req, res) => {
  res.send({ webasic: true });
});

app.get('/catalog', (req, res) => {
  const fileRoot = path.resolve(__dirname, '..', 'examples')
  const contents = fs.readdirSync(fileRoot)
  res.send(contents)
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
