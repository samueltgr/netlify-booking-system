const { google } = require('googleapis');

// These values are securely provided by Netlify's environment variables
const SCRIPT_ID = process.env.GOOGLE_SCRIPT_ID;
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
// The key needs to have its newline characters properly formatted
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');

// Authenticate our service
const auth = new google.auth.JWT({
  email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: GOOGLE_PRIVATE_KEY,
  scopes: ['https://www.googleapis.com/auth/script.projects'],
});

const script = google.script({ version: 'v1', auth });

// This is the main function that runs when our frontend calls it
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };
  
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  const { action } = event.queryStringParameters;
  let functionToCall;
  let parameters;

  if (action === 'getSlots') {
    functionToCall = 'getAvailableSlots';
    parameters = [event.queryStringParameters.date];
  } else if (action === 'processBooking' && event.httpMethod === 'POST') {
    functionToCall = 'processBooking';
    parameters = [JSON.parse(event.body)];
  } else {
    return { statusCode: 400, body: 'Invalid action specified.', headers };
  }

  try {
    const response = await script.scripts.run({
      scriptId: SCRIPT_ID,
      requestBody: {
        function: functionToCall,
        parameters: parameters,
        devMode: false,
      },
    });

    if (response.data.error) {
      const errorMessage = response.data.error.details[0].errorMessage;
      return { statusCode: 409, body: JSON.stringify({ error: errorMessage }), headers };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(response.data.response.result),
      headers,
    };

  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: 'The server bridge failed.' }), headers };
  }
};
