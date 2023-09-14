const axios = require('axios');
const { request, response} = require('express');
require('dotenv').config();

const getPeliculasJson = (req, res) => {
    const fs = require('fs');
    fs.readFile('./data/peliculas.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Error al leer el archivo:', err);
            res.status(500).send('Error al leer el archivo');
            return;
        }
        res.json(JSON.parse(data));
    });
}

const buscarPeliculasJson = (req, res) => {
    const clave = process.env.API_KEY;

    const { busqueda } = req.body;
    
    axios.get(`https://www.omdbapi.com/?apikey=${clave}&s=${busqueda}`)
    .then(({ data }) => {
        if (data.Response === 'False') {
            res.json(data);
            return;
        }

        const peliculas = data.Search;

        function obtenerDetallesPelicula(imdbID) {
            return axios.get(`https://www.omdbapi.com/?apikey=${clave}&i=${imdbID}`)
                .then(({ data }) => {
                    if (data.Response === 'True') {
                        return data;
                    }
                    return null;
                })
                .catch((error) => {
                    console.error(error);
                    return null;
                });
        }
        const promesas = peliculas.map((pelicula) => {
            if (!pelicula.Plot) {
                return obtenerDetallesPelicula(pelicula.imdbID)
                    .then((peliculaDetalles) => {
                        if (peliculaDetalles && peliculaDetalles.Plot) {
                            pelicula.Plot = peliculaDetalles.Plot;
                        }
                        else {
                            pelicula.Plot = "No se encontró una sinópsis";
                        }
                        return pelicula;
                    });
            }
            return movie;
        });

        Promise.all(promesas)
            .then((peliculasActualizadas) => {
                data.Search = peliculasActualizadas;
                res.json(data);
            })
            .catch((error) => {
                console.log(error);
                res.status(400).json({
                    status: 400,
                    msg: 'Error'
                });
            });
    })
    .catch((error) => {
        console.log(error);
        res.status(400).json({
            status: 400,
            msg: 'Error'
        });
    });
}

module.exports = {
    getPeliculasJson,
    buscarPeliculasJson
};