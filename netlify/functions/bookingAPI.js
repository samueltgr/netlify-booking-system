// This function is now a simple, secure forwarder.

const WEB_APP_URL = process.env.GOOGLE_WEB_APP_URL;
const API_KEY = process.env.API_SECRET_KEY;

exports.handler = async (event, context) => {
  // Set up headers for the request to Google
  const headers = {
    "Content-Type": "application/json",
    "x-api-key": API_KEY, // Our secret password
  };

  // The data we are sending to Google comes from the frontend
  const body = event.body;

  try {
    const response = await fetch(WEB_APP_URL, {
      method: "POST",
      headers: headers,
      body: body,
    });

    if (!response.ok) {
      throw new Error(`Google Script failed with status: ${response.statusText}`);
    }

    const data = await response.json();

    // Return the response from Google back to our frontend
    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
};
