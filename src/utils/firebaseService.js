import firestore from '@react-native-firebase/firestore';

export const FirebaseService = {
  backupUserProfile: async (userId, localState) => {
    if (!userId) return;
    try {
      // 1. Update Profile
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
        lastBackupAt: firestore.FieldValue.serverTimestamp(), 
      };
      
      const userRef = firestore().collection('users').doc(userId);
      await userRef.set(profilePayload, { merge: true });

      // 2. Backup historyLogs as subcollection documents
      const logsRef = userRef.collection('daily_logs');
      for (const [date, data] of Object.entries(localState.historyLogs || {})) {
        await logsRef.doc(date).set(data, { merge: true });
      }
      console.log('✅ Firebase Backup Successful');
    } catch (error) { 
      console.error('❌ Firebase Backup Failed:', error); 
    }
  },

  fetchUserProfile: async (userId) => {
    if (!userId) return null;
    try {
      const userRef = firestore().collection('users').doc(userId);
      const docSnap = await userRef.get();
      const data = docSnap.exists ? docSnap.data() : {};

      // Fetch the subcollection
      const logsSnapshot = await userRef.collection('daily_logs').get();
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