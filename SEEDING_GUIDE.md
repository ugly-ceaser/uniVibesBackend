# Guide Seeding Documentation

This project includes comprehensive seeding functionality for populating the database with sample guide data for testing and development purposes.

## Features

- **20 High-Quality Sample Guides**: Covers common university topics like course registration, campus navigation, library usage, etc.
- **Multiple Seeding Options**: Command line, API endpoint, and programmatic seeding
- **Flexible Configuration**: Option to clear existing data or preserve it
- **Comprehensive Logging**: Detailed feedback on seeding operations

## Usage Methods

### 1. Command Line (Recommended)

```bash
# Seed guides while preserving existing data
npm run seed:guides

# Clear existing guides and seed fresh data
npm run seed:guides:clear

# Run quietly (minimal output)
ts-node src/utils/databaseSeeder.ts --quiet
```

### 2. API Endpoint (Admin Only)

```http
POST /api/guide/dev/seed
Authorization: Bearer <admin-token>

# Optional query parameter to clear existing data
POST /api/guide/dev/seed?clear=true
```

**Response:**
```json
{
  "message": "Sample guides seeded successfully",
  "data": {
    "totalCount": 20,
    "addedCount": 20
  }
}
```

### 3. Programmatic Usage

```typescript
import { DatabaseSeeder } from './src/utils/databaseSeeder';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const seeder = new DatabaseSeeder(prisma);

// Seed without clearing existing data
await seeder.seedGuides({ clearExisting: false });

// Seed and clear existing data
await seeder.seedGuides({ clearExisting: true });

// Get database stats
const stats = await seeder.getGuidesStats();
console.log(`Total guides: ${stats.totalCount}`);
```

## Sample Guide Topics

The seeding function creates guides covering:

1. Course Registration Process
2. Campus Navigation
3. Library Usage
4. Student ID Application
5. Online Fee Payment
6. Hostel Accommodation
7. Academic Calendar
8. Transcript Application
9. Health Services
10. Internet Access
11. Student Organizations
12. Exam Procedures
13. Research Guidelines
14. Financial Aid
15. Campus Safety
16. Course Changes
17. Graduate Applications
18. Dining Services
19. Lab Safety
20. Graduation Requirements

## Files Structure

```
src/
├── utils/
│   ├── seedGuides.ts          # Core seeding data and functions
│   └── databaseSeeder.ts      # Seeding service class and CLI
├── modules/guide/
│   ├── guide.service.ts       # Added seedSampleGuides method
│   ├── guide.controller.ts    # Added seedSampleGuides endpoint
│   └── guide.routes.ts        # Added /dev/seed route
```

## Environment Requirements

- Node.js >= 18
- PostgreSQL database
- Prisma configured
- Required dependencies installed

## Security Notes

- The API seeding endpoint requires admin authentication
- Consider removing or securing the seeding endpoints in production
- The seeding functions include error handling and transaction safety

## Troubleshooting

**Database Connection Issues:**
```bash
# Ensure your DATABASE_URL is set correctly
npm run prisma:generate
```

**Permission Errors:**
- Ensure the database user has CREATE, INSERT, and DELETE permissions
- Verify the admin token has proper ADMIN role authorization

**TypeScript Errors:**
```bash
# Regenerate Prisma client
npm run prisma:generate

# Check TypeScript compilation
npm run build
```
