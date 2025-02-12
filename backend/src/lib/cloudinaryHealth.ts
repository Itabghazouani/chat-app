import cloudinary from './cloudinary';

export async function checkCloudinaryConnection() {
  try {
    const result = await cloudinary.api.ping();
    return { isConnected: true, status: result };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    console.error('Cloudinary connection error:', {
      timestamp: new Date().toISOString(),
      error: errorMessage,
      credentials: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME ? 'Present' : 'Missing',
        apiKey: process.env.CLOUDINARY_API_KEY ? 'Present' : 'Missing',
        apiSecret: process.env.CLOUDINARY_API_SECRET ? 'Present' : 'Missing',
      },
    });

    return { isConnected: false, error: errorMessage };
  }
}
