import { SePayPgClient } from 'sepay-pg-node';

let sepayInstance = null;

export const getSePay = () => {
  if (!sepayInstance) {
    const merchantId = process.env.SEPAY_MERCHANT_ID || 'YOUR_MERCHANT_ID';
    const secretKey = process.env.SEPAY_SECRET_KEY || 'YOUR_MERCHANT_SECRET_KEY';

    sepayInstance = new SePayPgClient({
      env: 'sandbox',
      merchant_id: merchantId,
      secret_key: secretKey
    });
  }
  return sepayInstance;
};
