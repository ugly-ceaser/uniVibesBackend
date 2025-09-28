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

/**
 * @swagger
 * components:
 *   schemas:
 *     MapLocation:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique location identifier
 *         name:
 *           type: string
 *           description: Location name
 *           example: Library
 *         description:
 *           type: string
 *           description: Location description
 *           example: Main university library with study areas
 *         latitude:
 *           type: number
 *           format: float
 *           description: Latitude coordinate
 *           example: 6.5244
 *         longitude:
 *           type: number
 *           format: float
 *           description: Longitude coordinate
 *           example: 3.3792
 *         category:
 *           type: string
 *           description: Location category
 *           example: Academic
 *         status:
 *           type: string
 *           enum: [APPROVED, PENDING, REJECTED, INVESTIGATING]
 *           description: Location approval status
 *           example: APPROVED
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Location creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *       required: [id, name, latitude, longitude, status, createdAt, updatedAt]
 */

/**
 * @swagger
 * /map:
 *   get:
 *     tags: [Map]
 *     summary: List approved map locations
 *     description: Retrieve a list of all approved campus map locations
 *     responses:
 *       200:
 *         description: Map locations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MapLocation'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /map/{id}:
 *   get:
 *     tags: [Map]
 *     summary: Get map location by ID
 *     description: Retrieve a specific approved map location by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Location ID
 *     responses:
 *       200:
 *         description: Map location retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/MapLocation'
 *       404:
 *         description: Location not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /map:
 *   post:
 *     tags: [Map]
 *     summary: Create a new map location (User)
 *     description: Submit a new map location for approval (requires authentication)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - latitude
 *               - longitude
 *             properties:
 *               name:
 *                 type: string
 *                 description: Location name
 *                 example: New Study Hall
 *               description:
 *                 type: string
 *                 description: Location description
 *                 example: Quiet study area on the second floor
 *               latitude:
 *                 type: number
 *                 format: float
 *                 description: Latitude coordinate
 *                 example: 6.5244
 *               longitude:
 *                 type: number
 *                 format: float
 *                 description: Longitude coordinate
 *                 example: 3.3792
 *               category:
 *                 type: string
 *                 description: Location category
 *                 example: Academic
 *     responses:
 *       201:
 *         description: Location submitted for approval
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/MapLocation'
 *       400:
 *         description: Bad request - Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /map/admin:
 *   post:
 *     tags: [Map]
 *     summary: Create a new map location (Admin)
 *     description: Create and approve a new map location directly - requires admin privileges
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - latitude
 *               - longitude
 *             properties:
 *               name:
 *                 type: string
 *                 description: Location name
 *               description:
 *                 type: string
 *                 description: Location description
 *               latitude:
 *                 type: number
 *                 format: float
 *                 description: Latitude coordinate
 *               longitude:
 *                 type: number
 *                 format: float
 *                 description: Longitude coordinate
 *               category:
 *                 type: string
 *                 description: Location category
 *     responses:
 *       201:
 *         description: Location created and approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/MapLocation'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Admin privileges required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /map/admin/pending:
 *   get:
 *     tags: [Map]
 *     summary: Get pending locations (Admin only)
 *     description: Retrieve all map locations pending approval
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending locations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MapLocation'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Admin privileges required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /map/{id}/approve:
 *   patch:
 *     tags: [Map]
 *     summary: Approve a location (Admin only)
 *     description: Approve a pending map location
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Location ID
 *     responses:
 *       200:
 *         description: Location approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Admin privileges required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Location not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     MapLocation:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique location identifier
 *         name:
 *           type: string
 *           description: Location name
 *           example: Main Library
 *         description:
 *           type: string
 *           description: Location description
 *           example: Central library with study halls and computer labs
 *         latitude:
 *           type: number
 *           format: float
 *           description: Location latitude coordinate
 *           example: 6.5244
 *         longitude:
 *           type: number
 *           format: float
 *           description: Location longitude coordinate
 *           example: 3.3792
 *         category:
 *           type: string
 *           description: Location category
 *           example: Academic
 *         status:
 *           type: string
 *           enum: [APPROVED, PENDING, REJECTED, UNDER_INVESTIGATION]
 *           description: Location approval status
 *           example: APPROVED
 *         submittedBy:
 *           type: string
 *           format: uuid
 *           description: ID of user who submitted the location
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Location creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *       required: [id, name, latitude, longitude, status, createdAt, updatedAt]
 */

/**
 * @swagger
 * /map:
 *   get:
 *     tags: [Map]
 *     summary: List approved map locations
 *     description: Retrieve all approved campus map locations
 *     responses:
 *       200:
 *         description: Map locations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MapLocation'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /map/{id}:
 *   get:
 *     tags: [Map]
 *     summary: Get map location by ID
 *     description: Retrieve a specific approved map location by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Location ID
 *     responses:
 *       200:
 *         description: Map location retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/MapLocation'
 *       404:
 *         description: Location not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /map:
 *   post:
 *     tags: [Map]
 *     summary: Submit a new map location
 *     description: Submit a new campus location for approval (requires authentication)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - latitude
 *               - longitude
 *             properties:
 *               name:
 *                 type: string
 *                 description: Location name
 *                 example: New Study Hall
 *               description:
 *                 type: string
 *                 description: Location description
 *                 example: Quiet study area with 50 seats
 *               latitude:
 *                 type: number
 *                 format: float
 *                 description: Location latitude coordinate
 *                 example: 6.5244
 *               longitude:
 *                 type: number
 *                 format: float
 *                 description: Location longitude coordinate
 *                 example: 3.3792
 *               category:
 *                 type: string
 *                 description: Location category
 *                 example: Academic
 *     responses:
 *       201:
 *         description: Location submitted successfully (pending approval)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/MapLocation'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /map/admin:
 *   post:
 *     tags: [Map]
 *     summary: Create approved location (Admin only)
 *     description: Create a new map location with automatic approval - requires admin privileges
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - latitude
 *               - longitude
 *             properties:
 *               name:
 *                 type: string
 *                 description: Location name
 *               description:
 *                 type: string
 *                 description: Location description
 *               latitude:
 *                 type: number
 *                 format: float
 *                 description: Location latitude coordinate
 *               longitude:
 *                 type: number
 *                 format: float
 *                 description: Location longitude coordinate
 *               category:
 *                 type: string
 *                 description: Location category
 *     responses:
 *       201:
 *         description: Location created and approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/MapLocation'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Admin privileges required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /map/admin/pending:
 *   get:
 *     tags: [Map]
 *     summary: Get pending locations (Admin only)
 *     description: Retrieve all map locations pending approval - requires admin privileges
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending locations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MapLocation'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Admin privileges required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /map/{id}/approve:
 *   patch:
 *     tags: [Map]
 *     summary: Approve location (Admin only)
 *     description: Approve a pending map location - requires admin privileges
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Location ID
 *     responses:
 *       200:
 *         description: Location approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/MapLocation'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Admin privileges required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Location not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /map/{id}/reject:
 *   patch:
 *     tags: [Map]
 *     summary: Reject location (Admin only)
 *     description: Reject a pending map location - requires admin privileges
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Location ID
 *     responses:
 *       200:
 *         description: Location rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/MapLocation'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Admin privileges required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Location not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

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