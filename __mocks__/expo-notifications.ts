export const requestPermissionsAsync = jest.fn().mockResolvedValue({ status: 'granted' });
export const scheduleNotificationAsync = jest.fn().mockResolvedValue('test-id');
export const setNotificationHandler = jest.fn().mockResolvedValue(null);
