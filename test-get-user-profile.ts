import { getUserProfile } from './src/services/userService.js';

(async () => {
  const userId = 'c7207348-1e40-4ebe-9dc3-7a4938a48450'; // Replace with a real userId if needed
  try {
    const res = await getUserProfile(userId);
    console.log('getUserProfile result:', res);
  } catch (err) {
    console.error('Error calling getUserProfile:', err);
  }
})();
