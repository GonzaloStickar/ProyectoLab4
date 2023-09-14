const axios = require('axios');
const { request, response} = require('express');
require('dotenv').config();

const clave = process.env.API_KEY;

const getPeliculas = (req = request, res = response) => {
    const nombre_peliculas = [];
    const imagenes_peliculas = [];
    const id_peliculas = [];
    const sinopsis_peliculas = [];

    //GENERAR PELÍCULAS A PARTIR DEL JSON peliculas.json (código).

    const fs = require('fs');
    fs.readFile('./data/peliculas.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Error al leer el archivo:', err);
            res.status(500).send('Error al leer el archivo');
            return;
        }
        // res.json(JSON.parse(data));

        const jsonData = JSON.parse(data);
        const nombres = jsonData.map(item => item.nombre);
        const imagenes = jsonData.map(item => item.img);
        const ids = jsonData.map(item => item.id);
        const sinopsis = jsonData.map(item => item.sinopsis)

        for (let i=0; i < 10; i++) {
            nombre_peliculas.push(nombres[i]);
            imagenes_peliculas.push(imagenes[i]);
            id_peliculas.push(ids[i]);
            sinopsis_peliculas.push(sinopsis[i]);
        }

        const peliculas = nombre_peliculas.map((nombre, i) => `
            <div id="${i}" class="contenedor">
                <a href="/pelicula/${id_peliculas[i]}">
                    <img src="${imagenes_peliculas[i]}" alt="${nombre}" width="225px" height="325px">
                </a>
                <p class="sinopsis_pelicula">${sinopsis_peliculas[i].length <= 120 ? sinopsis_peliculas[i] + '.. <a class="enlace_pelicula" href="/pelicula/'+id_peliculas[i]+'">más</a>' : sinopsis_peliculas[i].slice(0, 120) + '... <a class="enlace_pelicula" href="/pelicula/'+id_peliculas[i]+'">más</a>'}</p>
                <p class="nombre_pelicula">${nombre}</p>
            </div>
        `).join('');

        const paginaPrincipal = fs.readFileSync('./public/templates/peliculas.html', 'utf8');
        if (peliculas.length>0) {
            const articulosPeliculas =`
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
            const paginaConNuevoContenido = paginaPrincipal.replace(/<main>[\s\S]*<\/main>/, `<main><h1>No hay películas</h1></main>`);
            res.status(404).send(paginaConNuevoContenido);
        }
    });
    // const { anio, ...resto } = req.query;
    // console.log(req.query);
    // console.log(resto);
    // res.status(401).json({name: `Peliculas del año ${anio}`});
}

const getPelicula = (req = request, res = response) => {  
    const {id} = req.params;
    //console.log(id);
    //res.json({name: `Pelicula con ID: ${id}`});
    
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
        // res.json(JSON.parse(data));

        const jsonData = JSON.parse(data);
        const nombres = jsonData.map(item => item.nombre);
        const imagenes = jsonData.map(item => item.img);
        const ids = jsonData.map(item => item.id);
        const sinopsis = jsonData.map(item => item.sinopsis)

        for (let i=0; i < 10; i++) {
            nombre_peliculas.push(nombres[i]);
            imagenes_peliculas.push(imagenes[i]);
            id_peliculas.push(ids[i]);
            sinopsis_peliculas.push(sinopsis[i]);
        }

        if (id in id_peliculas) {
            res.json({"msg":"La película está en el JSON PELÍCULAS"});
            //SE DEBE BUSCAR LA PELICULA POR EL ID EN EL JSON (está arriba).
        }
        else {
            axios.get(`https://www.omdbapi.com/?apikey=${clave}&i=${id}`)
            .then(({ data }) => {
                res.json({data});
            })
            .catch((error) => {
                console.log(error);
            });
        }
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