const { Router } = require('express');
const { getPeliculas, getPelicula, buscarPeliculas, wrongRequest, getDirectores, getPeliculasGenero, wrongRequestGenero} = require('../controllers/main');
const { getPeliculasJson, buscarPeliculasJson, getPeliculaJson, wrongRequestJson, getDirectoresJson, getPeliculasGeneroJson, wrongRequestGeneroJson} = require('../controllers/mainJsonResponse');
const { checkUserAgent } = require('./userAgentMiddleware');
const bodyParser = require('body-parser');

const rutas = Router();

rutas.use(bodyParser.json());

rutas.get('/', (req, res) => {
    res.redirect('/peliculas');
});

rutas.get('/peliculas',checkUserAgent(getPeliculas, getPeliculasJson));
rutas.get('/pelicula/:id', checkUserAgent(getPelicula, getPeliculaJson));

rutas.post('/peliculas/buscar', checkUserAgent(buscarPeliculas, buscarPeliculasJson));

rutas.get('/peliculas/directores', async (req, res) => {
    checkUserAgent(getDirectores, getDirectoresJson)(req, res);
});

rutas.get('/peliculas/:genero', async (req, res) => {
    const opcion = req.params.genero;
    const opcionBuscada = opcion.toLowerCase();
    switch (opcionBuscada) {
        case 'aventura':
            checkUserAgent(getPeliculasGenero, getPeliculasGeneroJson)(req, res);
            break;
        case 'accion':
            checkUserAgent(getPeliculasGenero, getPeliculasGeneroJson)(req, res);
            break;
        case 'comedia':
            checkUserAgent(getPeliculasGenero, getPeliculasGeneroJson)(req, res);
            break;
        case 'drama':
            checkUserAgent(getPeliculasGenero, getPeliculasGeneroJson)(req, res);
            break;
        case 'animacion':
            checkUserAgent(getPeliculasGenero, getPeliculasGeneroJson)(req, res);
            break;
        case 'directores':
            checkUserAgent(getDirectores, getDirectoresJson)(req, res);
        default:
            checkUserAgent(wrongRequestGenero, wrongRequestGeneroJson)(req,res);
            break;
    }
});

rutas.all('*', checkUserAgent(wrongRequest, wrongRequestJson));

module.exports = rutas;