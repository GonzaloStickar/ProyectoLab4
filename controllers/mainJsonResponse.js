const axios = require('axios');
const { request, response} = require('express');
require('dotenv').config();

const clave = process.env.API_KEY;

function numeroRandom(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

const getPeliculasJson = async (req, res) => {
    try {
        const fs = require('fs');
        const paginaPrincipal = fs.readFileSync('./public/templates/peliculas.html', 'utf8');

        const nombre_peliculas = [];
        const imagenes_peliculas = [];
        const sinopsis_peliculas = [];
        const id_peliculas = [];

        const obtenerPalabraAleatoria = async () => {
            try {
                const response = await axios.get('https://www.palabrasque.com/palabra-aleatoria.php?Submit=Nueva+palabra');
                if (response.status === 200) {
                    const html = response.data;
                    const regex = /<font data="palabra" size="6" \/><b>(\w+)<\/b><\/font>/;
                    const match = html.match(regex);
                    if (match) {
                        return match[1];
                    }
                    else {
                        console.log('No se encontró una palabra aleatoria en la página.');
                        return obtenerPalabraAleatoria();
                    }
                }
                else {
                    console.log('Error al obtener la página:', response.status);
                    return obtenerPalabraAleatoria();
                }
            }
            catch (error) {
                console.error(error);
                throw error;
            }
        };

        const obtenerInfoPelicula = async (palabra) => {
            const palabraSinPrimerCaracterYEnMinusculas = palabra.substring(1).toLowerCase();
            const palabraPrimerosTresCaracteres = palabraSinPrimerCaracterYEnMinusculas.substring(0, numeroRandom(1, 7));
        
            try {
                const { data } = await axios.get(`https://www.omdbapi.com/?t=${palabraPrimerosTresCaracteres}&apikey=${clave}`);
                
                if (data.Response === "True") {
                    if (data.Poster != "N/A" && data.Title != "N/A") {
                        try {
                            await axios.get(data.Poster);
                        }
                        catch (posterError) {
                            console.log('Error al obtener el póster:', posterError.message);
                        }
        
                        nombre_peliculas.push(data.Title);
                        imagenes_peliculas.push(data.Poster);
                        id_peliculas.push(data.imdbID);
        
                        try {
                            const { data: data2 } = await axios.get(`https://www.omdbapi.com/?apikey=${clave}&i=${data.imdbID}`);
                            
                            if (data2.Response !== 'False' && "Plot" in data2 && data2.Plot != "N/A") {
                                sinopsis_peliculas.push(data2.Plot);
                            }
                            else {
                                sinopsis_peliculas.push("Error al buscar una sinopsis / No se encontró una sinopsis");
                            }
                        }
                        catch (omdbError) {
                            console.log('Error al obtener información de la película desde OMDB:', omdbError.message);
                        }
                    }
                    else {
                        const nuevaPalabra = await obtenerPalabraAleatoria();
                        if (nuevaPalabra) {
                            return obtenerInfoPelicula(nuevaPalabra);
                        }
                    }
                }
                else {
                    // Si la respuesta de OMDB es 'False' o 'Not Found', intenta con otra palabra aleatoria
                    console.log(`La película '${palabraPrimerosTresCaracteres}' no se encontró en OMDB. Intentando con otra palabra.`);
                    const nuevaPalabra = await obtenerPalabraAleatoria();
                    if (nuevaPalabra) {
                        return obtenerInfoPelicula(nuevaPalabra);
                    }
                }
            }
            catch (error) {
                console.error(error);
                throw error;
            }
        };
        

        const promesas = Array.from({ length: 10 }, async () => {
            const palabra = await obtenerPalabraAleatoria();
            if (palabra) {
                return obtenerInfoPelicula(palabra);
            }
        });

        await Promise.all(promesas);

        const peliculas = [];

        if (nombre_peliculas.length > 0) {
            for (let i = 0; i < nombre_peliculas.length; i++) {
                peliculas.push({
                    nombre: nombre_peliculas[i],
                    imagen: imagenes_peliculas[i],
                    sinopsis: sinopsis_peliculas[i],
                    id: id_peliculas[i]
                });
            }
            res.status(200).json(peliculas);
        }
        else {
            res.status(404).json({ message: 'No se encontraron películas' });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            status: 500,
            msg: 'Error'
        });
    }
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

const getPeliculaJson = (req, res) => {  
    const {id} = req.params; 
    axios.get(`https://www.omdbapi.com/?apikey=${clave}&i=${id}`)
    .then(({ data }) => {
        res.json({data});
    })
    .catch((error) => {
        console.log(error);
    });
}

module.exports = {
    getPeliculasJson,
    buscarPeliculasJson,
    getPeliculaJson
};