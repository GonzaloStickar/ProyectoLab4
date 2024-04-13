const checkUserAgent = (primeraFuncion, segundaFuncion) => {
    return (req, res) => {
        const userAgent = req.headers['user-agent'];
        const isFromFlutterApp = req.headers['x-flutter-app'] === 'true';
        
        if (isFromFlutterApp || (userAgent && (userAgent.includes('AppleWebKit') || userAgent.includes('Safari') || userAgent.includes('Chrome') || userAgent.includes('Mozilla') || userAgent.includes('Edge')))) {
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
