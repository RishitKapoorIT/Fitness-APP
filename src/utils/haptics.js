/**
 * Triggers native haptic vibration feedback using the device's vibration hardware.
 * Safely checks for navigator.vibrate compatibility.
 * 
 * @param {'light' | 'medium' | 'success' | 'warning' | 'countdown' | number} type - Predefined haptic pattern or manual duration in ms
 */
export const triggerHaptic = (type = 'light') => {
  if (typeof navigator === 'undefined' || !navigator.vibrate) {
    return;
  }

  try {
    switch (type) {
      case 'light':
        navigator.vibrate(15);
        break;
      case 'medium':
        navigator.vibrate(30);
        break;
      case 'success':
        navigator.vibrate([50, 50, 50]);
        break;
      case 'warning':
        navigator.vibrate([100, 50, 100]);
        break;
      case 'countdown':
        navigator.vibrate(80);
        break;
      default:
        if (typeof type === 'number') {
          navigator.vibrate(type);
        }
        break;
    }
  } catch (error) {
    console.warn('Haptic vibration failed:', error);
  }
};
