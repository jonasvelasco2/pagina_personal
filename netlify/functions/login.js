// Esta función se ejecuta en el servidor de Netlify, no en el navegador del usuario.

exports.handler = async function(event, context) {
    
    // DEBUG: Muestra en los logs de Netlify qué se está recibiendo.
    console.log("Función 'login' invocada.");
    console.log("Datos recibidos en el evento:", event.body);

    const { passcode } = JSON.parse(event.body);
    console.log("Código introducido por el usuario:", passcode);

    // Obtiene la contraseña correcta desde las variables de entorno de Netlify.
    const CORRECT_PASSCODE = process.env.SITE_PASSCODE;
    
    // DEBUG: Verifica si la variable de entorno se está leyendo correctamente.
    // ¡CUIDADO! No dejes esta línea en producción si te preocupa que la contraseña aparezca en los logs.
    // Es solo para depuración inicial.
    console.log("Contraseña correcta almacenada (variable de entorno):", CORRECT_PASSCODE);

    if (!CORRECT_PASSCODE) {
        console.error("¡ERROR CRÍTICO! La variable de entorno SITE_PASSCODE no está configurada en Netlify.");
        return {
            statusCode: 500, // Internal Server Error
            body: JSON.stringify({ message: "Error de configuración del servidor." })
        };
    }

    if (passcode === CORRECT_PASSCODE) {
        console.log("Acceso CONCEDIDO.");
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: "Acceso concedido",
                redirectUrl: "../../recursos-privados.html"
            })
        };
    } else {
        console.log("Acceso DENEGADO. Código incorrecto.");
        return {
            statusCode: 401, // No autorizado
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: "Acceso denegado. El código es incorrecto." })
        };
    }
};

