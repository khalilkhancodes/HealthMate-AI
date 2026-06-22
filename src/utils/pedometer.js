import { Pedometer } from 'expo-sensors';
export async function isPedometerAvailable() {
  try {
    return await Pedometer.isAvailableAsync();
  } catch (error) {
    console.warn('[Pedometer] isAvailableAsync error', error);
    return false;
  }
}
export async function requestPedometerPermission() {
  try {
    const result = await Pedometer.requestPermissionsAsync();
    const status = result?.status;
    return status === 'granted';
  } catch (error) {
    console.warn('[Pedometer] requestPermissionsAsync error', error);
    return false;
  }
}
