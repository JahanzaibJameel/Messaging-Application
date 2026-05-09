import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { applyRTL } from '../i18n/rtl';

interface LanguageSwitcherProps {
  /** Whether to show the switcher (development only) */
  show?: boolean;
  /** Custom styles */
  style?: any;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ show = __DEV__, style }) => {
  const { i18n, t } = useTranslation();

  const switchLanguage = (language: string) => {
    i18n.changeLanguage(language);
    applyRTL();
  };

  if (!show) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{t('general.language') || 'Language'}:</Text>
      <View style={styles.buttons}>
        <TouchableOpacity
          style={[
            styles.button,
            i18n.language === 'en' && styles.activeButton,
          ]}
          onPress={() => switchLanguage('en')}
          accessibilityRole="button"
          accessibilityLabel="Switch to English"
          accessibilityHint="Changes app language to English"
        >
          <Text
            style={[
              styles.buttonText,
              i18n.language === 'en' && styles.activeButtonText,
            ]}
          >
            English
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            i18n.language === 'ar' && styles.activeButton,
          ]}
          onPress={() => switchLanguage('ar')}
          accessibilityRole="button"
          accessibilityLabel="Switch to Arabic"
          accessibilityHint="Changes app language to Arabic and enables RTL layout"
        >
          <Text
            style={[
              styles.buttonText,
              i18n.language === 'ar' && styles.activeButtonText,
            ]}
          >
            العربية
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginRight: 12,
  },
  buttons: {
    flexDirection: 'row',
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: 44,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  buttonText: {
    fontSize: 12,
    color: '#333333',
    fontWeight: '500',
  },
  activeButtonText: {
    color: '#ffffff',
  },
});

export default LanguageSwitcher;
