import express from "express";

const router = express.Router();
const app = express();

// 1. JSON body parser
app.use(express.json());

// 2. Oma middleware: kirjaa pyynnön ja kutsuu next
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// 3. Router on myös middleware, ja se ajetaan vain omille poluilleen
app.use(router);

router.get("/a", (req, res, next) => {
  res.send("Hello this is route a");
});

router.post("/c", (req, res, next) => {
  res.send(`Hello this is route c. Message is ${req.body.message}`);
});

// Reitti, joka heittää virheen, jotta virheenkäsittelijä näkyy toiminnassa
router.get("/fail", (req, res, next) => {
  throw new Error("A failure occurred!");
});

// 4. Virheenkäsittelijä: neljäs parametri (err) tekee siitä error middlewaren
app.use((err, req, res, next) => {
  res.status(500).send(`Error: ${err.message}`);
});

app.listen({ port: 8000 }, () => {
  console.log("Express Node server has loaded! (middleware demo)");
});
