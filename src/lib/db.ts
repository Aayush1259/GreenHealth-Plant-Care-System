// Dummy database implementation (PostgreSQL removed)
// This file provides a mock interface for code that previously used Prisma

// Define a dummy client that returns empty results
const dummyClient = {
  // Add dummy methods that would be used in the application
  user: {
    findMany: async () => [],
    findFirst: async () => null,
    create: async () => ({}),
    update: async () => ({}),
    delete: async () => ({}),
    count: async () => 0,
  },
  plant: {
    findMany: async () => [],
    findFirst: async () => null,
    create: async () => ({}),
    update: async () => ({}),
    delete: async () => ({}),
    count: async () => 0,
  },
  diseaseCheck: {
    findMany: async () => [],
    findFirst: async () => null,
    create: async () => ({}),
    update: async () => ({}),
    delete: async () => ({}),
    count: async () => 0,
  },
  communityPost: {
    findMany: async () => [],
    findFirst: async () => null,
    create: async () => ({}),
    update: async () => ({}),
    delete: async () => ({}),
    count: async () => 0,
  },
  comment: {
    findMany: async () => [],
    findFirst: async () => null,
    create: async () => ({}),
    update: async () => ({}),
    delete: async () => ({}),
    count: async () => 0,
  },
  like: {
    findMany: async () => [],
    findFirst: async () => null,
    create: async () => ({}),
    update: async () => ({}),
    delete: async () => ({}),
    count: async () => 0,
  },
  $disconnect: async () => {},
  $connect: async () => {},
  $queryRaw: async () => [],
};

// Export the dummy client
export const prisma = dummyClient;

// Log that PostgreSQL has been removed
console.log('NOTE: PostgreSQL/Prisma has been removed from this project. Database operations will return empty results.'); 