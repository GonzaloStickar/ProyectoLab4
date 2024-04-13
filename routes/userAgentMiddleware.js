const checkUserAgent = (primeraFuncion, segundaFuncion) => {
    return (req, res) => {
        const userAgent = req.headers['user-agent'];
        const fromFlutterApp = req.headers['user-agent'] === 'X-Flutter-App'; // Agregar esta línea para verificar si la solicitud proviene de tu aplicación Flutter

        if (fromFlutterApp || (userAgent && (userAgent.includes('AppleWebKit') || userAgent.includes('Safari') || userAgent.includes('Chrome') || userAgent.includes('Mozilla') || userAgent.includes('Edge')))) {
            primeraFuncion(req, res);
        }
        else {
            segundaFuncion(req, res);
        }
    };
};

module.exports = {
    checkUserAgent
}
