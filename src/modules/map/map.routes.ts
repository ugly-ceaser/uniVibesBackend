import { Router } from 'express';
import type { AwilixContainer } from 'awilix';
import { createCacheMiddleware } from '../../middlewares/cacheMiddleware';
import { requireAuth, authorizeRoles } from '../../middlewares/authMiddleware';
import { 
  listMapLocations, 
  getMapLocation,
  createMapLocation,
  createMapLocationAdmin,
  updateMapLocation,
  deleteMapLocation,
  listAllMapLocations,
  getMapLocationAdmin,
  getPendingLocations,
  approveLocation,
  rejectLocation,
  investigateLocation
} from './map.controller';

export const createMapRouter = (container: AwilixContainer) => {
  const router = Router();
  const redis = container.resolve('redis');

  // Public routes (with caching) - only approved locations
  router.get('/', createCacheMiddleware(redis, { ttlSeconds: 300 }), listMapLocations);
  router.get('/:id', createCacheMiddleware(redis, { ttlSeconds: 300 }), getMapLocation);

  // User routes (require authentication)
  router.post('/', requireAuth, createMapLocation);

  // Admin routes (require ADMIN role)
  router.post('/admin', requireAuth, authorizeRoles('ADMIN'), createMapLocationAdmin);
  router.put('/:id', requireAuth, authorizeRoles('ADMIN'), updateMapLocation);
  router.delete('/:id', requireAuth, authorizeRoles('ADMIN'), deleteMapLocation);
  
  // Admin: View all locations (including pending approval)
  router.get('/admin/all', requireAuth, authorizeRoles('ADMIN'), listAllMapLocations);
  router.get('/admin/:id', requireAuth, authorizeRoles('ADMIN'), getMapLocationAdmin);
  
  // Admin: Manage pending locations
  router.get('/admin/pending', requireAuth, authorizeRoles('ADMIN'), getPendingLocations);
  router.patch('/:id/approve', requireAuth, authorizeRoles('ADMIN'), approveLocation);
  router.patch('/:id/reject', requireAuth, authorizeRoles('ADMIN'), rejectLocation);
  router.patch('/:id/investigate', requireAuth, authorizeRoles('ADMIN'), investigateLocation);

  return router;
}; 