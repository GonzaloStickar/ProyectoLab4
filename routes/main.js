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

rutas.get('/peliculas/:genero', (req, res) => {
    const genero = req.params.genero;
    switch (genero) {
        case 'aventura':
            res.send('Página de películas de aventura');
            break;
        case 'accion':
            res.send('Página de películas de acción');
            break;
        case 'comedia':
            res.send('Página de películas de comedia');
            break;
        case 'drama':
            res.send('Página de películas de drama');
            break;
        case 'cienciaficcion':
            res.send('Página de películas de ciencia ficción');
            break;
        case 'suspenso':
            res.send('Página de películas de suspenso');
            break;
        case 'animacion':
            res.send('Página de películas de animación');
            break;
        default:
            res.status(404).send('Género no encontrado.');
            break;
    }
});

module.exports = rutas;