const { Router } = require('express');
const { getPeliculas, getPelicula, buscarPeliculas, wrongRequest, getDirectores, getPeliculasGenero} = require('../controllers/main');
const { getPeliculasJson, buscarPeliculasJson, getPeliculaJson, wrongRequestJson, getDirectoresJson, getPeliculasGeneroJson} = require('../controllers/mainJsonResponse');
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
    await getDirectores(req, res);
});

rutas.get('/peliculas/:genero', async (req, res) => {
    const genero = req.params.genero;
    switch (genero) {
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
        case 'cienciaficcion':
            checkUserAgent(getPeliculasGenero, getPeliculasGeneroJson)(req, res);
            break;
        case 'suspenso':
            checkUserAgent(getPeliculasGenero, getPeliculasGeneroJson)(req, res);
            break;
        case 'animacion':
            checkUserAgent(getPeliculasGenero, getPeliculasGeneroJson)(req, res);
            break;
        case 'directores':
            checkUserAgent(getDirectores, getDirectoresJson)(req, res);
        default:
            checkUserAgent(wrongRequest, wrongRequestJson)(req,res);
            break;
    }
});

rutas.all('*', checkUserAgent(wrongRequest, wrongRequestJson));

module.exports = rutas;