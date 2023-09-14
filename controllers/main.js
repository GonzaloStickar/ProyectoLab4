const axios = require('axios');
const { request, response} = require('express');
require('dotenv').config();

const clave = process.env.API_KEY;

function numeroRandom(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

const getPeliculas = async (req = request, res = response) => {
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

        if (nombre_peliculas.length > 0) {
            const peliculas = nombre_peliculas.map((nombre, i) => `
                <div id="${i}" class="contenedor">
                    <a href="/pelicula/${id_peliculas[i]}">
                        <img src="${imagenes_peliculas[i]}" alt="${nombre}" width="225px" height="325px">
                    </a>
                    <p class="sinopsis_pelicula">${sinopsis_peliculas[i].length <= 120 ? sinopsis_peliculas[i] + '.. <a class="enlace_pelicula" href="/pelicula/'+id_peliculas[i]+'">más</a>' : sinopsis_peliculas[i].slice(0, 120) + '... <a class="enlace_pelicula" href="/pelicula/'+id_peliculas[i]+'">más</a>'}</p>
                    <p class="nombre_pelicula">${nombre}</p>
                </div>
            `).join('');

            const articulosPeliculas = `
                <main>
                    <article>
                        <div class="articulos">
                            ${peliculas}
                        </div>
                    </article>
                </main>
            `;

            const paginaConNuevoContenido = paginaPrincipal.replace(/<main>[\s\S]*<\/main>/, `<main>${articulosPeliculas}</main>`);
            res.status(200).send(paginaConNuevoContenido);
        }
        else {
            const paginaConNuevoContenido = paginaPrincipal.replace(/<main>[\s\S]*<\/main>/, `<main><h1>Hay muchas películas con la busqueda: '${palabraPrimerosTresCaracteres}'</h1></main>`);
            res.status(404).send(paginaConNuevoContenido);
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            status: 500,
            msg: 'Error'
        });
    }
};

const getPelicula = (req, res) => {  
    const {id} = req.params; 
    axios.get(`https://www.omdbapi.com/?apikey=${clave}&i=${id}`)
    .then(({ data }) => {
        res.json({data});
    })
    .catch((error) => {
        console.log(error);
    });
}

const buscarPeliculas = (req, res) => {
    const { busqueda } = req.body;

    const fs = require('fs');
    const paginaPrincipal = fs.readFileSync('./public/templates/peliculas.html', 'utf8');

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
                    const peliculas = nombre_peliculas.map((nombre, i) => `
                        <div id="${i}" class="contenedor">
                            <a href="/pelicula/${id_peliculas[i]}">
                                <img src="${imagenes_peliculas[i]}" alt="${nombre}" width="225px" height="325px">
                            </a>
                            <p class="sinopsis_pelicula">${sinopsis_peliculas[i].length <= 120 ? sinopsis_peliculas[i] + '.. <a class="enlace_pelicula" href="/pelicula/'+id_peliculas[i]+'">más</a>' : sinopsis_peliculas[i].slice(0, 120) + '... <a class="enlace_pelicula" href="/pelicula/'+id_peliculas[i]+'">más</a>'}</p>
                            <p class="nombre_pelicula">${nombre}</p>
                        </div>
                    `).join('');

                    const articulosPeliculas = `
                        <main>
                            <article>
                                <div class="articulos">
                                    ${peliculas}
                                </div>
                            </article>
                        </main>
                    `;

                    const paginaConNuevoContenido = paginaPrincipal.replace(/<main>[\s\S]*<\/main>/, `<main>${articulosPeliculas}</main>`);
                    res.status(200).send(paginaConNuevoContenido);
                }
                else {
                    const paginaConNuevoContenido = paginaPrincipal.replace(/<main>[\s\S]*<\/main>/, `<main><h1>Hay muchas películas con la busqueda: '${busqueda}'</h1></main>`);
                    res.status(404).send(paginaConNuevoContenido);
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
            const paginaConNuevoContenido = paginaPrincipal.replace(/<main>[\s\S]*<\/main>/, `<main><h1>No hay películas con la búsqueda: ${busqueda}.</h1></main>`);
            res.status(404).send(paginaConNuevoContenido);
        }
    })
    .catch((error) => {
        console.log(error);
        res.status(400).json({
            status: 400,
            msg: 'Error'
        });
    });
    
    //res.json(peliculas_Encontradas);
    // const paginaConNuevoContenido = paginaPrincipal.replace(/<main>[\s\S]*<\/main>/, `<main>${peliculas_Encontradas}</main>`);
    // res.status(200).send(paginaConNuevoContenido);
    
};

const getEstrenos = (req = request, res = response) => {
    res.json({name: 'Estrenos'});
}

const getActores = (req = request, res = response) => {
    res.json({name: 'Actores'});
}

const getOrigenNombre = (req = request, res = response) => {
    console.log(req.params);
    const { name } = req.params;

    axios.get(`https://api.nationalize.io/?name=${name}`)
    .then(({ status, data, statusText }) => {
        console.log({ status, data, statusText });
        res.status(200).json({
            status,
            data,
            statusText,
            name
        });
    })
    .catch((error)=>{
        console.log(error);
        res.status(400).json({
            status:400,
            msg: 'Error inesperado'
        });
    });        
}

module.exports = {
    getPeliculas,
    getEstrenos,
    getActores,
    getPelicula,
    getOrigenNombre,
    buscarPeliculas
};