const axios = require('axios');
const { request, response} = require('express');
require('dotenv').config();

const getPeliculas = (req = request, res = response) => {

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
        const nombres = jsonData.map(item => item.nombre);
        const imagenes = jsonData.map(item => item.img);
        const ids = jsonData.map(item => item.id);
        const sinopsis = jsonData.map(item => item.sinopsis);

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
            res.status(200).send(paginaConNuevoContenido);
        }
    });
    // const { anio, ...resto } = req.query;
    // console.log(req.query);
    // console.log(resto);
    // res.status(401).json({name: `Peliculas del año ${anio}`});
};

const buscarPeliculas = (req, res) => {

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
            res.status(200).send(paginaConNuevoContenido);
        }
    });
};

const getPelicula = (req, res) => {  
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
            const paginaPrincipal = fs.readFileSync('./public/templates/peliculas.html', 'utf8');

            const pelicula = `
                <main>
                    <article>
                        <div class="info_pelicula">
                            <p>${peliculaEncontrada.nombre}</p>
                            <img src="${peliculaEncontrada.img}" alt="${peliculaEncontrada.nombre}">
                            <p>${peliculaEncontrada.sinopsis}</p>
                            <p><strong>Año: </strong>${peliculaEncontrada.anio}</p>
                        </div>
                    </article>
                </main>
            `;

            const paginaConNuevoContenido = paginaPrincipal.replace(/<main>[\s\S]*<\/main>/, `<main>${pelicula}</main>`);
            res.status(200).send(paginaConNuevoContenido);
        }
        else {
            const paginaNotFound = `
                <main>
                    <article>
                        <h1>No se encontró la película</h1>
                    </article>
                </main>
            `;

            const paginaPrincipal = fs.readFileSync('./public/templates/peliculas.html', 'utf8');
            const paginaConNuevoContenido = paginaPrincipal.replace(/<main>[\s\S]*<\/main>/, `<main>${paginaNotFound}</main>`);
            res.status(404).send(paginaConNuevoContenido);
        }
    });
}

const wrongRequest = (req = request, res = response) => {
    const fs = require('fs');
    const paginaPrincipal = fs.readFileSync('./public/templates/peliculas.html', 'utf8');
    
    const mensajePaginaNotFound = `
        <div class="cajaPaginaNotFound">
            <h1>Página no encontrada :(</h1>
        </div>
    `;

    const paginaSinHeaderYFooter = paginaPrincipal
    .replace(/<header>[\s\S]*<\/header>/, '')
    .replace(/<footer>[\s\S]*<\/footer>/, '')
    .replace(/<main>[\s\S]*<\/main>/, `<main>${mensajePaginaNotFound}</main>`);
    res.status(200).send(paginaSinHeaderYFooter);
}

const getDirectores = async (req, res) => {
    const fs = require('fs');
    fs.readFile('./data/peliculas.json', 'utf8', (err, data) => {

        const paginaPrincipal = fs.readFileSync('./public/templates/peliculas.html', 'utf8');

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
            const directores = directores_lista.map((director, i) => `
            <div class="directores-container">
                <h3>Director de la película: ${nombre_peliculas[i]}</h3>
                <ul class="directores-list">
                    <h3>${director}<h3>
                </ul>
            </div>
            `).join('');

            const directoresPeliculas = `
                <main>
                    <div class="directoresDiv">
                        ${directores}
                    </div>
                </main>
            `;

            const paginaConNuevoContenido = paginaPrincipal.replace(/<main>[\s\S]*<\/main>/, `<main>${directoresPeliculas}</main>`);
            res.status(200).send(paginaConNuevoContenido);
        }
        else {
            const mensajePaginaNotFound = `
                <div class="cajaPaginaNotFound">
                    <h1>No se encontraron Directores :(</h1>
                </div>
            `;

            const paginaSinHeaderYFooter = paginaPrincipal
            .replace(/<header>[\s\S]*<\/header>/, '')
            .replace(/<footer>[\s\S]*<\/footer>/, '')
            .replace(/<main>[\s\S]*<\/main>/, `<main>${mensajePaginaNotFound}</main>`);
            res.status(200).send(paginaSinHeaderYFooter);
        }
    });
}

const getPeliculasGenero = (req,res) => {

    const fs = require('fs');
    fs.readFile('./data/peliculas.json', 'utf8', (err, data) => {

        const paginaPrincipal = fs.readFileSync('./public/templates/peliculas.html', 'utf8');

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
            const mensajePaginaNotFound = `
                <div class="cajaPaginaNotFound">
                    <h1>No se encontraron películas con el género buscado :(</h1>
                </div>
            `;

            const paginaEditada = paginaPrincipal
            .replace(/<main>[\s\S]*<\/main>/, `<main>${mensajePaginaNotFound}</main>`);
            res.status(404).send(paginaEditada);
        }
        else {
            const resultados = peliculasPorGenero.map((pelicula) => {
                return {
                    nombre: pelicula.nombre,
                    director: pelicula.director
                };
            });

            const directores = resultados.map((pelicula, i) => `
                <div class="directores-container">
                    <h3>Nombre de la película: ${pelicula.nombre}</h3>
                    <h3>Director de la película: ${pelicula.director}</h3>
                </div>
            `).join('');

            const directoresPeliculas = `
                <main>
                    <div class="directoresDiv">
                        ${directores}
                    </div>
                </main>
            `;

            const paginaConNuevoContenido = paginaPrincipal.replace(/<main>[\s\S]*<\/main>/, `<main>${directoresPeliculas}</main>`);
            res.status(200).send(paginaConNuevoContenido);
        }
    });
}

module.exports = {
    getPeliculas,
    getPelicula,
    buscarPeliculas,
    wrongRequest,
    getDirectores,
    getPeliculasGenero
};