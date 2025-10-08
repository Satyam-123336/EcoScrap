import { db } from './db';
import { users, pickupRequests, certificates, notifications } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';


async function cleanupTestData(userId: string) {
  try {
    await db.delete(notifications).where(eq(notifications.userId, userId));
    await db.delete(certificates).where(eq(certificates.userId, userId));
    await db.delete(pickupRequests).where(eq(pickupRequests.userId, userId));
    await db.delete(users).where(eq(users.id, userId));
    console.log(' Test data cleaned up successfully');
  } catch (error) {
    console.error(' Error cleaning up test data:', error);
  }
}

async function testDatabase() {
  let userId: string | null = null;

  try {
    console.log(' Starting database tests...');

    
    console.log('\n Test 1: Creating a user...');
    userId = randomUUID();
    const [user] = await db.insert(users).values({
      id: userId,
      username: 'testuser',
      email: 'test@example.com',
      password: 'test123', 
      name: 'Test User',
      phone: '1234567890',
      address: '123 Test St'
    }).returning();
    
    console.log(' User created:', user.id);

    
    console.log('\n Test 2: Creating a pickup request...');
    const [pickup] = await db.insert(pickupRequests).values({
      id: randomUUID(),
      userId: user.id,
      eWasteType: 'Electronics',
      weight: '5.5', 
      address: '123 Test St',
      pickupDate: new Date(),
      status: 'scheduled'
    }).returning();
    
    console.log(' Pickup request created:', pickup.id);

    
    console.log('\n Test 3: Creating a certificate...');
    const [certificate] = await db.insert(certificates).values({
      id: randomUUID(),
      userId: user.id,
      title: 'Test Certificate',
      description: 'Test Description',
      weight: '5.5', 
      co2Saved: '2.5' 
    }).returning();
    
    console.log(' Certificate created:', certificate.id);

    
    console.log('\n Test 4: Creating a notification...');
    const [notification] = await db.insert(notifications).values({
      id: randomUUID(),
      userId: user.id,
      title: 'Test Notification',
      message: 'This is a test notification',
      type: 'info',
      relatedPickupId: pickup.id,
    }).returning();
    
    console.log(' Notification created:', notification.id);

    
    console.log('\n Test 5: Reading user data with related records...');
    const userData = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });
    
    console.log(' User data retrieved:', userData?.username);
    console.log('\n All database tests completed successfully!');

  } catch (error) {
    console.error(' Error during database tests:', error);
    throw error;
  } finally {
    
    if (userId) {
      console.log('\n Cleaning up test data...');
      await cleanupTestData(userId);
    }
  }
}


process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
  process.exit(1);
});


testDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed to run tests:', error);
    process.exit(1);
  });

