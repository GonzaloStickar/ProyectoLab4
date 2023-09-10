const axios = require('axios');
const { request, response} = require('express');
require('dotenv').config();

const clave = process.env.API_KEY;

const getPeliculas = (req = request, res = response) => {  
    // const { anio, ...resto } = req.query;
    // console.log(req.query);
    // console.log(resto);
    // res.status(401).json({name: `Peliculas del año ${anio}`});
    
    const nombre_peliculas = [];
    const imagenes_peliculas = [];

    const obtenerPalabraAleatoria = () => {
        return axios.get('https://www.palabrasque.com/palabra-aleatoria.php?Submit=Nueva+palabra')
            .then((response) => {
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
            });
    };

    const obtenerInfoPelicula = (palabra) => {
        const palabraSinPrimerCaracterYEnMinusculas = palabra.substring(1).toLowerCase();
        const palabraPrimerosTresCaracteres = palabraSinPrimerCaracterYEnMinusculas.substring(0, 3);
        
        return axios.get(`https://www.omdbapi.com/?t=${palabraPrimerosTresCaracteres}&apikey=${clave}`)
            .then(({ data }) => {
                if (data.Response === "True") { //Para evitar que nos de datos "undefined"
                    if (data.Poster == "N/A" || data.Title == "N/A") {
                        return obtenerPalabraAleatoria()
                            .then((nuevaPalabra) => {
                                if (nuevaPalabra) {
                                    return obtenerInfoPelicula(nuevaPalabra);
                                }
                            });
                    }
                    else {
                        nombre_peliculas.push(data.Title);
                        imagenes_peliculas.push(data.Poster);
                    }
                }
                else {
                    return obtenerPalabraAleatoria()
                    .then((nuevaPalabra) => {
                        if (nuevaPalabra) {
                            // Llamamos recursivamente a la función para obtener datos de la nueva palabra
                            return obtenerInfoPelicula(nuevaPalabra);
                        }
                    });
                }
            })
            .catch((error) => {
                console.log(error);
                res.status(400).json({
                    status: 400,
                    msg: 'Error al obtener nombre de la película'
                });
            });
    };

    // Crear un array de promesas para las solicitudes a la API de OMDB
    const omdbPromises = Array.from({ length: 10 }, () => {
        return obtenerPalabraAleatoria()
            .then((palabra) => {
                if (palabra) {
                    return obtenerInfoPelicula(palabra);
                }
            });
    });

    // Esperar a que todas las promesas se completen
    Promise.all(omdbPromises)
        .then(() => {
            console.log(nombre_peliculas);
            console.log(imagenes_peliculas);

            const fs = require('fs');
            const peliculas = nombre_peliculas.map((nombre, i) => `
                <div id="${i}">
                    <a>
                        <img src="${imagenes_peliculas[i]}" alt="${nombre}" width="225px" height="325px">
                    </a>
                    <p class="nombre_pelicula">${nombre}</p>
                </div>
            `).join('');

            const paginaPrincipal = fs.readFileSync('./public/templates/peliculas.html', 'utf8');

            const userAgent = req.headers['user-agent'];

            if (userAgent.includes('Postman')) {
                if (peliculas.length > 0) {
                    const envioCompleto = {
                        nombre_peliculas,
                        imagenes_peliculas
                    };
                    res.status(200).json(envioCompleto);
                }
                else {
                    res.status(404).json({ error: `No hay películas` });
                }
            }
            else {
                if (peliculas.length > 0) {
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
                    const paginaConNuevoContenido = paginaPrincipal.replace(/<main>[\s\S]*<\/main>/, `<main><h1>No hay películas</h1></main>`);
                    res.status(404).send(paginaConNuevoContenido);
                }
            }
        })
        .catch((error) => {
            console.error('Error en la solicitud:', error);
        });


    //GENERAR PELÍCULAS A PARTIR DEL JSON peliculas.json (código).

    /*
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

        for (let i=0; i < 10; i++) {
            nombre_peliculas.push(nombres[i]);
            imagenes_peliculas.push(imagenes[i]);
        }

        const peliculas = nombre_peliculas.map((nombre, i) => `
            <div id="${i}">
                <a>
                    <img src="${imagenes_peliculas[i]}" alt="${nombre}" width="225px" height="325px">
                </a>
                <p class="nombre_pelicula">${nombre}</p>
            </div>
        `).join('');

        const paginaPrincipal = fs.readFileSync('./public/templates/peliculas.html', 'utf8');

        const userAgent = req.headers['user-agent'];

        if (userAgent.includes('Postman')) {
            if (peliculas.length>0) {
                const envioCompleto = {
                    nombre_peliculas,
                    imagenes_peliculas
                }
                res.status(200).json(envioCompleto);
            }
            else {
                res.status(404).json({error: `No hay películas`});
            }
        }
        else {
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
        }
    });
    */
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