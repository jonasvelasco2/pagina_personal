exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse form data
    const params = new URLSearchParams(event.body);
    const formData = {
      nombre: params.get('nombre'),
      correo: params.get('correo'),
      pais: params.get('pais'),
      intereses: params.getAll('intereses'),
      timestamp: new Date().toISOString(),
      userAgent: event.headers['user-agent'] || 'Unknown',
      ip: event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'Unknown'
    };

    // Basic validation
    if (!formData.nombre || !formData.correo || !formData.pais) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Faltan campos requeridos: nombre, correo y país son obligatorios' 
        })
      };
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.correo)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'El formato del correo electrónico no es válido' 
        })
      };
    }

    // Log subscription (in production, you would save this to a database)
    console.log('Nueva suscripción:', JSON.stringify(formData, null, 2));

    // Here you could:
    // 1. Save to a database (Airtable, Google Sheets, etc.)
    // 2. Send to an email service (Mailchimp, ConvertKit, etc.)
    // 3. Send a confirmation email
    // 4. Add to a mailing list

    // For now, we'll just return success
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Suscripción registrada exitosamente',
        data: {
          nombre: formData.nombre,
          correo: formData.correo,
          pais: formData.pais,
          intereses: formData.intereses
        }
      })
    };

  } catch (error) {
    console.error('Error processing subscription:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Error interno del servidor',
        message: 'No se pudo procesar la suscripción. Por favor, inténtalo de nuevo.'
      })
    };
  }
};
