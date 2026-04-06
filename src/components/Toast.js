import React, { useState, useCallback, useRef, useEffect, createContext, useContext } from 'react';
import { Animated, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ToastContext = createContext(null);

const TOAST_CONFIG = {
  success: { icon: 'checkmark-circle', bg: '#2ecc71', text: '#fff' },
  error: { icon: 'close-circle', bg: '#e74c3c', text: '#fff' },
  info: { icon: 'information-circle', bg: '#3498db', text: '#fff' },
};

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-30)).current;
  const timerRef = useRef(null);

  const show = useCallback((message, type = 'success', duration = 2500) => {
    if (Platform.OS === 'web') {
      window.alert(message);
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, type });
    opacity.setValue(0);
    translateY.setValue(-30);

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();

    timerRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -30, duration: 300, useNativeDriver: true }),
      ]).start(() => setToast(null));
    }, duration);
  }, [opacity, translateY]);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const config = toast ? TOAST_CONFIG[toast.type] || TOAST_CONFIG.info : null;

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.container,
            { backgroundColor: config.bg, opacity, transform: [{ translateY }] },
          ]}
        >
          <Ionicons name={config.icon} size={20} color={config.text} style={styles.icon} />
          <Text style={[styles.text, { color: config.text }]}>{toast.message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const show = useContext(ToastContext);
  if (!show) throw new Error('useToast must be used within ToastProvider');
  return show;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    zIndex: 9999,
  },
  icon: { marginRight: 10 },
  text: { fontSize: 14, fontWeight: '600', flex: 1 },
});
