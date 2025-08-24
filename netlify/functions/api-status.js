// Netlify function to handle /api/status endpoint
exports.handler = async function(event, context) {
  try {
    // You can replace this with actual data from your backend
    const responseData = {
      status: "operational",
      version: "1.0.0",
      lastUpdated: new Date().toISOString(),
      services: [
        {
          name: "Invoice Processing",
          status: "online",
          uptime: "99.9%"
        },
        {
          name: "Data Extraction",
          status: "online",
          uptime: "99.7%"
        },
        {
          name: "Authentication",
          status: "online",
          uptime: "100%"
        }
      ],
      metrics: {
        totalProcessed: 1245,
        averageProcessingTime: "2.3s",
        successRate: "98.5%"
      }
    };

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(responseData)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" })
    };
  }
};