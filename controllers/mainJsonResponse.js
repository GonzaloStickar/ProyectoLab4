const axios = require('axios');
const { request, response} = require('express');
require('dotenv').config();

const getPeliculasJson = async (req, res) => {
    const nombre_peliculas = [];
    const imagenes_peliculas = [];
    const id_peliculas = [];
    const sinopsis_peliculas = [];

    const fs = require('fs');
    fs.readFile('./data/peliculas.json', 'utf8', (err, data) => {

        if (err) {
            console.error('Error al leer el archivo:', err);
            res.status(500).send('Error al leer el archivo');
            return;
        }

        const jsonData = JSON.parse(data);
        
        const ultimasPeliculas = jsonData.slice(-10);
        
        const nombres = ultimasPeliculas.map(item => item.nombre);
        const imagenes = ultimasPeliculas.map(item => item.img);
        const ids = ultimasPeliculas.map(item => item.id);
        const sinopsis = ultimasPeliculas.map(item => item.sinopsis);

        for (let i=0; i < 10; i++) {
            nombre_peliculas.push(nombres[i]);
            imagenes_peliculas.push(imagenes[i]);
            id_peliculas.push(ids[i]);
            sinopsis_peliculas.push(sinopsis[i]);
        }

        res.status(200).json({
        "nombre_peliculas":nombre_peliculas, 
        "imagenes_peliculas":imagenes_peliculas, 
        "id_peliculas":id_peliculas, 
        "sinopsis_peliculas":sinopsis_peliculas});
    });
}

const buscarPeliculasJson = (req, res) => {

    const { busqueda } = req.body;
    
    const nombre_peliculas = [];
    const imagenes_peliculas = [];
    const id_peliculas = [];
    const sinopsis_peliculas = [];

    const fs = require('fs');
    fs.readFile('./data/peliculas.json', 'utf8', (err, data) => {

        if (err) {
            console.error('Error al leer el archivo:', err);
            res.status(500).send('Error al leer el archivo');
            return;
        }

        const jsonData = JSON.parse(data);

        jsonData.forEach(pelicula => {
            const titulo = pelicula.nombre.toLowerCase();
            const sinopsis = pelicula.sinopsis.toLowerCase();
            const busquedaMinusculas = busqueda.toLowerCase();
    
            if ((titulo.includes(busquedaMinusculas) || sinopsis.includes(busquedaMinusculas)) && nombre_peliculas.length<10) {
                nombre_peliculas.push(pelicula.nombre);
                imagenes_peliculas.push(pelicula.img);
                id_peliculas.push(pelicula.id);
                sinopsis_peliculas.push(pelicula.sinopsis);
            }
        });

        res.status(200).json({
        "nombre_peliculas":nombre_peliculas, 
        "imagenes_peliculas":imagenes_peliculas, 
        "id_peliculas":id_peliculas, 
        "sinopsis_peliculas":sinopsis_peliculas});
    });
}

const getPeliculaJson = (req, res) => {

    const { id } = req.params;

    const fs = require('fs');

    fs.readFile('./data/peliculas.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Error al leer el archivo:', err);
            res.status(500).send('Error al leer el archivo');
            return;
        }

        const jsonData = JSON.parse(data);

        const peliculaEncontrada = jsonData.find((peli) => peli.id === id);

        if (peliculaEncontrada) {
            res.status(200).json({
            "nombre_pelicula":peliculaEncontrada.nombre, 
            "imagen_pelicula":peliculaEncontrada.img, 
            "anio_pelicula":peliculaEncontrada.anio, 
            "sinopsis_pelicula":peliculaEncontrada.sinopsis
            });
        }
        else {
            res.status(404).json({
            "Response":"No se encontró la película con ese id"
            });
        }
    });
}

const wrongRequestJson = (req = request, res = response) => {
    res.status(404).json({"Response":"404", "message":"Página no encontrada"});
}

const getDirectoresJson = (req, res) => {

    const fs = require('fs');
    fs.readFile('./data/peliculas.json', 'utf8', (err, data) => {

        if (err) {
            console.error('Error al leer el archivo:', err);
            res.status(500).send('Error al leer el archivo');
            return;
        }

        const jsonData = JSON.parse(data);

        const nombre_peliculas = [];
        const directores_lista = [];

        for (let i=0; i<10; i++) {
            const peliculaAleatoria = jsonData[Math.floor(Math.random() * jsonData.length)];

            const nombrePelicula = peliculaAleatoria.nombre;
            const directorAleatorio = peliculaAleatoria.director;

            nombre_peliculas.push(nombrePelicula)
            directores_lista.push(directorAleatorio);
        };

        if (directores_lista.length > 0) {
            res.status(404).json({
            "nombre_peliculas":nombre_peliculas,
            "directores_lista":directores_lista
            });
        }
        else {
            res.status(404).json({"Response:":"No se encontraron Directores"});
        }
    });
}

const getPeliculasGeneroJson = (req, res) => {
    const fs = require('fs');
    fs.readFile('./data/peliculas.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Error al leer el archivo:', err);
            res.status(500).send('Error al leer el archivo');
            return;
        }

        const jsonData = JSON.parse(data);
        const { genero } = req.params;
        const generoBuscado = genero.toLowerCase();

        const peliculasPorGenero = jsonData.filter((pelicula) => {
            const generosPelicula = pelicula.genero.toLowerCase().split(', ').map(g => g.trim());
            return generosPelicula.includes(generoBuscado);
        });

        if (peliculasPorGenero.length === 0) {
            res.status(404).json({"Response":"No se encontraron películas con ese género"});
        }
        else {
            const resultados = peliculasPorGenero.map((pelicula) => {
                return {
                    nombre: pelicula.nombre,
                    director: pelicula.director
                };
            });
            res.status(200).json({resultados});
        }
    });
}

const wrongRequestGeneroJson = (req = request, res = response) => {
    req.status(404).json({"Response:":"Género no encontrado"})
}

module.exports = {
    getPeliculasJson,
    buscarPeliculasJson,
    getPeliculaJson,
    wrongRequestJson,
    getDirectoresJson,
    getPeliculasGeneroJson,
    wrongRequestGeneroJson
};