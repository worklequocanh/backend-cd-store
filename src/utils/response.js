export const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, data });
};

export const sendError = (res, message, statusCode = 400) => {
  return res.status(statusCode).json({ success: false, message });
};

export const sendPaginated = (res, data, pagination, message = 'Success') => {
  return res.status(200).json({ success: true, message, data, pagination });
};
