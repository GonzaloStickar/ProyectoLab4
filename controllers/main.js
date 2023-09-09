const axios = require('axios');
const { request, response} = require('express');

const getPeliculas = (req = request, res = response) => {  
    const { anio, ...resto } = req.query;
    // console.log(req.query);
    // console.log(resto);
    // res.status(401).json({name: `Peliculas del año ${anio}`});
    

    const fs = require('fs');
    fs.readFile('./data/peliculas.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Error al leer el archivo:', err);
            res.status(500).send('Error al leer el archivo');
            return;
        }
    // res.json(JSON.parse(data));
    const nombre_peliculas = [];
    const imagenes_peliculas = [];

    const jsonData = JSON.parse(data);
    const nombres = jsonData.map(item => item.nombre);
    const imagenes = jsonData.map(item => item.img);

    for (let i=0; i < nombres.length && nombre_peliculas.length < 10; i++) {
        nombre_peliculas.push(nombres[i]);
        imagenes_peliculas.push(imagenes[i]);
    }

    const pelicula = nombre_peliculas.map((nombre, i) => `
        <a>
            <p id="nombrePelicula">${nombre}</p>
            <img src="${imagenes_peliculas[i]}" alt="${nombre}" width="215px" height="325px">
        </a>
    `).join('');

        res.send(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Películas Online</title>
                    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
                    <meta charset="utf-8">
                    <link rel="stylesheet" type="text/css" href="/static/estilos/peliculasEstilos.css">
                    </head>
                <body>
                    <article>
                        <div class="articulos">
                            <ul id="pelicula">
                                ${pelicula}
                            </ul>
                        </div>
                    </article>
                </body>

            </html>
        `);
    });
}

const getPelicula = (req = request, res = response) => {  
    const {id} = req.params;
    console.log(id);
    res.json({name: `Pelicula con ID: ${id}`});
}


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
            // handle success
            console.log({ status, data, statusText });
            res.status(200).json({
                status,
                data,
                statusText,
                name
            });
        })
        .catch((error)=>{
            // handle error
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
    getOrigenNombre
};