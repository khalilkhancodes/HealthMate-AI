import {
  aggregateRecord,
  getSdkStatus,
  initialize,
  requestPermission,
  SdkAvailabilityStatus,
  getGrantedPermissions,
} from 'react-native-health-connect';

let isInitialized = false;

export function getHealthConnectStatusLabel(status) {
  if (status === SdkAvailabilityStatus.SDK_AVAILABLE) return 'SDK_AVAILABLE';
  if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE) return 'SDK_UNAVAILABLE';
  if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) {
    return 'SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED';
  }
  return `UNKNOWN_STATUS_${String(status)}`;
}

export async function getHealthConnectStatus() {
  try {
    const status = await getSdkStatus();
    const label = getHealthConnectStatusLabel(status);
    console.log('[HealthConnect] getSdkStatus ->', status, label);
    return { status, label };
  } catch (error) {
    console.warn('[HealthConnect] getSdkStatus error', error);
    return { status: null, label: 'SDK_STATUS_ERROR' };
  }
}

export async function isHealthConnectAvailable() {
  try {
    const status = await getSdkStatus();
    console.log('[HealthConnect] getSdkStatus ->', status, getHealthConnectStatusLabel(status));
    return status === SdkAvailabilityStatus.SDK_AVAILABLE;
  } catch (_error) {
    console.warn('[HealthConnect] getSdkStatus error', _error);
    return false;
  }
}

export async function requestStepPermissions() {
  const { status, label } = await getHealthConnectStatus();
  const available = status === SdkAvailabilityStatus.SDK_AVAILABLE;

  if (!available) {
    console.warn('[HealthConnect] not available on device ->', label);
    if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) {
      // CRITICAL FIX: Removed openHealthConnectSettings() to prevent the ActivityNotFoundException crash.
      console.warn('[HealthConnect] CRITICAL: You must manually install Health Connect from the Google Play Store.');
    }
    return false;
  }

  try {
    if (!isInitialized) {
      await initialize();
      isInitialized = true;
      console.log('[HealthConnect] initialized');
    }

    const grantedPermissions = await getGrantedPermissions();
    const hasStepsPermission = grantedPermissions.some(
      (perm) => perm.recordType === 'Steps' && perm.accessType === 'read'
    );

    if (hasStepsPermission) {
      // If we already have permission, silently return true without opening the popup!
      return true; 
    }

    const permResult = await requestPermission([{ accessType: 'read', recordType: 'Steps' }]);
    console.log('[HealthConnect] requestPermission ->', permResult);
    return true;
  } catch (err) {
    console.warn('[HealthConnect] requestStepPermissions error', err);
    return false;
  }
}

export async function fetchTodaySteps() {
  const available = await isHealthConnectAvailable();
  if (!available) return 0;

  if (!isInitialized) {
    await initialize();
    isInitialized = true;
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  try {
    const result = await aggregateRecord({
      recordType: 'Steps',
      timeRangeFilter: {
        operator: 'between',
        startTime: startOfDay.toISOString(),
        endTime: new Date().toISOString(),
      },
    });

    console.log('[HealthConnect] aggregateRecord result ->', result);
    return Number(result?.COUNT_TOTAL ?? 0);
  } catch (err) {
    console.warn('[HealthConnect] fetchTodaySteps error', err);
    return null; // <--- This prevents the UI from flickering to 0 when rate-limited!
  }
}