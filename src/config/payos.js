import PayOS from '@payos/node';

let payosInstance = null;

export const getPayOS = () => {
  if (!payosInstance) {
    const clientId = process.env.PAYOS_CLIENT_ID;
    const apiKey = process.env.PAYOS_API_KEY;
    const checksumKey = process.env.PAYOS_CHECKSUM_KEY;

    if (!clientId || !apiKey || !checksumKey) {
      throw new Error('PayOS credentials are not configured in environment variables');
    }

    payosInstance = new PayOS(clientId, apiKey, checksumKey);
  }
  return payosInstance;
};
