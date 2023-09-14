const checkUserAgent = (primeraFuncion, segundaFuncion) => {
    return (req, res) => {
        const userAgent = req.headers['user-agent'];
        if (userAgent && (userAgent.includes('AppleWebKit') || userAgent.includes('Safari') || userAgent.includes('Chrome') || userAgent.includes('Mozilla') || userAgent.includes('Edge'))) {
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