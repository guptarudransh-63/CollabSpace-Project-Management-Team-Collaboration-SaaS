import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return ApiResponse.error(res, 'Not authorized to access this route. Please login.', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'collabspace_super_secret_jwt_key_2026_xyz987');
    const user = await User.findById(decoded.id).select('-password');

    if (!user || !user.isActive) {
      return ApiResponse.error(res, 'User no longer exists or is deactivated.', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    return ApiResponse.error(res, 'Session invalid or expired. Please login again.', 401);
  }
};
