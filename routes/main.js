const { Router } = require('express');
const { getEstrenos, getPeliculas, getActores, getPelicula, getOrigenNombre } = require('../controllers/main');

const rutas = Router();

rutas.get('/', (req, res) => {
    res.redirect('/peliculas');
});

rutas.get('/peliculas', getPeliculas);
rutas.get('/pelicula/:id', getPelicula);

rutas.get('/peliculas/estrenos', getEstrenos);
rutas.get('/peliculas/actores', getActores);
rutas.get('/peliculas/nombre/:name', getOrigenNombre);

module.exports = rutas;