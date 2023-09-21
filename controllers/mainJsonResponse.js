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
                        if (!(nombre_peliculas.includes(data.Title))) {
                            nombre_peliculas.push(data.Title);
                            imagenes_peliculas.push(data.Poster);
                            id_peliculas.push(data.imdbID);
                        }

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

        if (nombre_peliculas.length > 0) {
            res.status(200).json({
                "nombre_peliculas":nombre_peliculas, 
                "imagenes_peliculas":imagenes_peliculas, 
                "id_peliculas":id_peliculas, 
                "sinopsis_peliculas":sinopsis_peliculas});
        }
        else {
            res.status(404).json({"Error":"No se encontraron películas"});
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

    const { busqueda } = req.body;

    const nombre_peliculas = [];
    const imagenes_peliculas = [];
    const id_peliculas = [];
    const sinopsis_peliculas = [];

    axios.get(`https://www.omdbapi.com/?apikey=${clave}&s=${busqueda}`)
    .then(({ data }) => {
        if (data.Response !== 'False') {
            const promesas = [];

            for (const pelicula of data.Search) {
                if (pelicula.Title == "N/A" || pelicula.Poster == "N/A") {
                    continue;
                }
                else {
                    axios.get(pelicula.Poster)
                    .then(response => {
                        if (response.status === 200) {
                            nombre_peliculas.push(pelicula.Title);
                            imagenes_peliculas.push(pelicula.Poster);
                            id_peliculas.push(pelicula.imdbID);
                        }
                    })
                    .catch (() => {
                    //   console.error("imagen Not Found");
                    });

                    const promesaDetalle = axios.get(`https://www.omdbapi.com/?apikey=${clave}&i=${pelicula.imdbID}`)
                        .then(({ data: data2 }) => {
                            if (data2.Response !== 'False') {
                                if ("Plot" in data2 && data2.Plot != "N/A") {
                                    sinopsis_peliculas.push(data2.Plot);
                                }
                                else {
                                    sinopsis_peliculas.push("Error al buscar una sinopsis / No se encontró una sinopsis");
                                }
                            }
                        })
                        .catch((error) => {
                            console.log(error);
                        });

                    promesas.push(promesaDetalle);
                }
            }

            Promise.all(promesas)
            .then(() => {
                if (nombre_peliculas.length > 0) {
                    res.status(200).json({
                        "nombre_peliculas":nombre_peliculas, 
                        "imagenes_peliculas":imagenes_peliculas, 
                        "id_peliculas":id_peliculas, 
                        "sinopsis_peliculas":sinopsis_peliculas});
                }
                else {
                    res.status(404).json({"Error":"No se encontraron películas"});
                }
            })
            .catch((error) => {
                console.log(error);
                res.status(400).json({
                    status: 400,
                    msg: 'Error'
                });
            });
        }
        else {
            res.status(404).json({"Error":"No se encontraron películas"});
        }
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

    const { id } = req.params;

    axios.get(`https://www.omdbapi.com/?apikey=${clave}&i=${id}`)
    .then(( response ) => {
        const peli = response.data;
        res.status(200).json({peli});
    })
    .catch((error) => {
        console.log(error);
    });
}

const wrongRequestJson = (req = request, res = response) => {
    res.status(404).json({"Response":"404", "message":"Página no encontrada"});
}

const getDirectoresJson = async (req, res) => {

    try {
        const directores_lista = [];
        const nombre_peliculas = [];

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
                    if ("Title" in data && "Director" in data && data.Director !== "N/A" && data.Title !== "N/A") {
                        nombre_peliculas.push(data.Title);
                        directores_lista.push(data.Director);
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

        if (directores_lista.length > 0) {
            res.status(200).json({
            "nombre_peliculas":nombre_peliculas,
            "directores_lista":directores_lista
            });
        }
        else {
            res.status(404).json({"Response:":"No se encontraron Directores"});
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

const getPeliculasGeneroJson = async (req, res) => {

    const { genero } = req.params;
    const generoBuscado = genero.toLowerCase();
    let generoBuscadoEnglish = "";

    switch (generoBuscado) {
        case 'aventura':
            generoBuscadoEnglish = "Adventure";
            break;
        case 'accion':
            generoBuscadoEnglish = "Action";
            break;
        case 'comedia':
            generoBuscadoEnglish = "Comedy";
            break;
        case 'drama':
            generoBuscadoEnglish = "Drama";
            break;
        case 'animacion':
            generoBuscadoEnglish = "Animation";
            break;
    }

    try {
        const generos_lista = [];
        const nombre_peliculas = [];

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
                    if ("Title" in data && "Genre" in data && data.Genre !== "N/A" && data.Title !== "N/A") {
                        const generos = data.Genre.toLowerCase().split(', ');

                        if (generos.includes(generoBuscadoEnglish.toLocaleLowerCase())) {
                            if (!(nombre_peliculas.includes(data.Title))) {
                                nombre_peliculas.push(data.Title);
                                generos_lista.push(data.Genre);
                            }
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

        if (generos_lista.length > 0) {
            res.status(200).json({
                "nombre_peliculas":nombre_peliculas,
                "generos_lista":generos_lista
            });
        }
        else {
            res.status(404).json({"Error":"No se encontraron peliculas con ese género"});
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