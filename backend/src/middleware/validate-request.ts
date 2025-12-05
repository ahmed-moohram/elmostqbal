import { Request, Response, NextFunction } from 'express';
// Change from import to require for express-validator
const { validationResult } = require('express-validator');

export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('Validation Errors:', errors.array());
    return res.status(400).json({ 
      message: 'خطأ في البيانات المدخلة',
      errors: errors.array() 
    });
  }
  console.log('Validation passed');
  next();
};