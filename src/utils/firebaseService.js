import firestore, { doc, setDoc, getDoc, collection, getDocs, serverTimestamp } from '@react-native-firebase/firestore';

export const FirebaseService = {
  backupUserProfile: async (userId, localState) => {
    if (!userId) return;
    try {
      // 1. Update Profile (No historyLogs inside this doc!)
      const profilePayload = {
        name: localState.name,
        gender: localState.gender,
        age: localState.age,
        heightCm: localState.heightCm,
        weightKg: localState.weightKg,
        targetWeightKg: localState.targetWeightKg,
        activityLevel: localState.activityLevel,
        primaryGoal: localState.primaryGoal,
        stepGoal: localState.stepGoal,
        waterGoalMl: localState.waterGoalMl,
        sleepGoalHours: localState.sleepGoalHours,
        isPremiumUser: localState.isPremiumUser,
        hasCompletedSetup: localState.hasCompletedSetup,
        lastBackupAt: serverTimestamp(), // ✅ Clean modular timestamp
      };
      await setDoc(doc(firestore(), 'users', userId), profilePayload, { merge: true });

      // 2. Backup historyLogs as subcollection documents
      const logsRef = collection(firestore(), 'users', userId, 'daily_logs');
      for (const [date, data] of Object.entries(localState.historyLogs || {})) {
        await setDoc(doc(logsRef, date), data, { merge: true });
      }
      console.log('✅ Firebase Backup (Profile + Subcollection) Successful');
    } catch (error) { 
      console.error('❌ Firebase Backup Failed:', error); 
    }
  },

  fetchUserProfile: async (userId) => {
    if (!userId) return null;
    try {
      const userRef = doc(firestore(), 'users', userId);
      const docSnap = await getDoc(userRef);
      const data = docSnap.exists ? docSnap.data() : {};

      // Fetch the subcollection
      const logsSnapshot = await getDocs(collection(firestore(), 'users', userId, 'daily_logs'));
      const historyLogs = {};
      logsSnapshot.forEach(document => { 
        historyLogs[document.id] = document.data(); 
      });
      
      return { ...data, historyLogs };
    } catch (error) { 
      console.error('❌ Firebase Fetch Failed:', error); 
      return null; 
    }
  }
};