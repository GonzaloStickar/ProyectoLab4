const { Router } = require('express');
const { getEstrenos, getPeliculas, getActores, getPelicula, getOrigenNombre, buscarPeliculas} = require('../controllers/main');
const { getPeliculasJson, buscarPeliculasJson } = require('../controllers/mainJsonResponse');
const { checkUserAgent } = require('./userAgentMiddleware');
const bodyParser = require('body-parser');

const rutas = Router();

rutas.use(bodyParser.json());

rutas.get('/', (req, res) => {
    res.redirect('/peliculas');
});

rutas.get('/peliculas',checkUserAgent(getPeliculas, getPeliculasJson));
rutas.get('/pelicula/:id', getPelicula);

rutas.get('/peliculas/estrenos', getEstrenos);
rutas.get('/peliculas/actores', getActores);
rutas.get('/peliculas/nombre/:name', getOrigenNombre);
rutas.post('/peliculas/buscar', checkUserAgent(buscarPeliculas, buscarPeliculasJson));

module.exports = rutas;