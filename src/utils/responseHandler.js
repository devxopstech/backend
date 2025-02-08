exports.successResponse = (res, statusCode, message, data) => {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  };
  
  exports.failedResponse = (res, statusCode, message, error = null) => {
    return res.status(statusCode).json({
      success: false,
      message,
      error,
    });
  };
  