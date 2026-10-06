const Joi = require('joi');
const config = require('../config');

// Validation schemas
const schemas = {
  // Auth schemas
  register: Joi.object({
    name: Joi.string()
      .min(config.validation.nameMinLength)
      .max(config.validation.nameMaxLength)
      .required()
      .messages({
        'string.min': `Name must be at least ${config.validation.nameMinLength} characters`,
        'string.max': `Name must not exceed ${config.validation.nameMaxLength} characters`,
        'any.required': 'Name is required'
      }),
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    phone_number: Joi.string()
      .pattern(/^\+?[0-9\s()-]{7,30}$/)
      .required()
      .messages({
        'string.pattern.base': 'Please provide a valid phone number',
        'any.required': 'Phone number is required'
      }),
    password: Joi.string()
      .min(config.validation.passwordMinLength)
      .max(config.validation.passwordMaxLength)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/)
      .required()
      .messages({
        'string.min': `Password must be at least ${config.validation.passwordMinLength} characters`,
        'string.max': `Password must not exceed ${config.validation.passwordMaxLength} characters`,
        'any.required': 'Password is required',
        'string.pattern.base': 'Password must include uppercase, lowercase, number, and special character'
      }),
    role: Joi.string()
      .valid('EV Driver', 'Station Operator')
      .required()
      .messages({
        'any.only': 'Role must be one of: EV User or Station Operator',
        'any.required': 'Role is required'
      }),
    stationData: Joi.object({
      stationName: Joi.string().min(3).max(100).optional(),
      lat: Joi.number().min(-90).max(90).optional(),
      lng: Joi.number().min(-180).max(180).optional(),
      contactNumber: Joi.string().allow('', null).pattern(/^[+]?[\d\s-()]+$/).optional(),
      services: Joi.object({
        charge: Joi.boolean().optional(),
        swap: Joi.boolean().optional()
      }).optional()
    }).optional().allow(null)
  }),

  login: Joi.object({
    identifier: Joi.string()
      .min(config.validation.nameMinLength)
      .max(254)
      .required()
      .messages({
        'any.required': 'Username or email is required'
      }),
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required'
      })
  }),

  // Reservation schemas
  bookSlot: Joi.object({
    station_id: Joi.number().integer().positive().required()
      .messages({
        'any.required': 'Station ID is required',
        'number.base': 'Station ID must be a number'
      }),
    slot_time: Joi.date().iso().required()
      .messages({
        'any.required': 'Slot time is required',
        'date.format': 'Slot time must be a valid ISO date'
      })
  }),

  checkIn: Joi.object({
    reservation_id: Joi.number().integer().positive().required()
      .messages({
        'any.required': 'Reservation ID is required'
      })
  }),

  completeSession: Joi.object({
    reservation_id: Joi.number().integer().positive().required()
      .messages({
        'any.required': 'Reservation ID is required'
      })
  }),

  // Battery swap schemas
  requestSwap: Joi.object({
    swap_id: Joi.number().integer().positive().required()
      .messages({
        'any.required': 'Swap station ID is required'
      })
  }),

  // Station schemas
  createStation: Joi.object({
    name: Joi.string().min(3).max(255).required()
      .messages({
        'any.required': 'Station name is required'
      }),
    latitude: Joi.number().min(-90).max(90).required()
      .messages({
        'any.required': 'Latitude is required'
      }),
    longitude: Joi.number().min(-180).max(180).required()
      .messages({
        'any.required': 'Longitude is required'
      }),
    type: Joi.string().valid('charging', 'swap').required()
      .messages({
        'any.required': 'Station type is required'
      }),
    slots: Joi.number().integer().min(1).max(100).required()
      .messages({
        'any.required': 'Slots/stock is required'
      }),
    price: Joi.number().min(0).max(100).optional(),
    contact_number: Joi.string().allow('', null).pattern(/^[+]?[\d\s-()]+$/).optional()
  }),

  updateStation: Joi.object({
    name: Joi.string().min(3).max(255).optional(),
    latitude: Joi.number().min(-90).max(90).optional(),
    longitude: Joi.number().min(-180).max(180).optional(),
    charger_type: Joi.string().valid('Level 1', 'Level 2', 'DC Fast', 'Fast').optional(),
    total_slots: Joi.number().integer().min(1).max(50).optional(),
    available_slots: Joi.number().integer().min(0).max(50).optional(),
    price_per_kwh: Joi.number().min(0).max(10).optional(),
    status: Joi.string().valid('active', 'inactive').optional(),
    contact_number: Joi.string().pattern(/^[+]?[\d\s-()]+$/).optional()
  }),

  // Wallet schemas
  addFunds: Joi.object({
    amount: Joi.number().min(0.01).max(10000).required()
      .messages({
        'any.required': 'Amount is required',
        'number.min': 'Amount must be at least 0.01',
        'number.max': 'Amount must not exceed 10000'
      })
  }),

  // Admin schemas
};

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        message: 'Validation failed',
        errors
      });
    }

    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
};

// Param validation middleware
const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        message: 'Parameter validation failed',
        errors
      });
    }

    req.params = value;
    next();
  };
};

const paramSchemas = {
  reservationId: Joi.object({
    reservation_id: Joi.number().integer().positive().required()
  }),
  stationId: Joi.object({
    id: Joi.number().integer().positive().required()
  }),
  swapId: Joi.object({
    id: Joi.number().integer().positive().required()
  })
};

module.exports = {
  schemas,
  validate,
  validateParams,
  paramSchemas
};
