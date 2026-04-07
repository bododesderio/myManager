import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { setLanguage, getCurrentLanguage, SUPPORTED_LANGUAGES } from '@/services/i18n';

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

const ALL_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili' },
];

export default function LanguageSettingsScreen() {
  const [selectedLanguage, setSelectedLanguage] = useState<string>(getCurrentLanguage());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelectedLanguage(getCurrentLanguage());
  }, []);

  async function handleSelect(code: string) {
    if (code === selectedLanguage) return;
    setSaving(true);
    try {
      await setLanguage(code);
      setSelectedLanguage(code);
    } finally {
      setSaving(false);
    }
  }

  const renderItem = ({ item }: { item: Language }) => {
    const supported = SUPPORTED_LANGUAGES.includes(item.code);
    return (
      <TouchableOpacity
        style={[
          styles.languageRow,
          selectedLanguage === item.code && styles.languageRowSelected,
          !supported && { opacity: 0.4 },
        ]}
        onPress={() => supported && handleSelect(item.code)}
        disabled={!supported || saving}
      >
        <View>
          <Text style={styles.languageName}>{item.name}</Text>
          <Text style={styles.nativeName}>{item.nativeName}</Text>
        </View>
        {selectedLanguage === item.code && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Language</Text>
        {saving ? <ActivityIndicator size="small" color="#7F77DD" /> : <View style={{ width: 40 }} />}
      </View>

      <FlatList
        data={ALL_LANGUAGES}
        renderItem={renderItem}
        keyExtractor={(item) => item.code}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  backText: { fontSize: 16, color: '#7F77DD', fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '600', color: '#1a1a1a' },
  list: { padding: 16 },
  languageRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 8,
  },
  languageRowSelected: { borderWidth: 2, borderColor: '#7F77DD' },
  languageName: { fontSize: 16, fontWeight: '500', color: '#1a1a1a' },
  nativeName: { fontSize: 13, color: '#999', marginTop: 2 },
  checkmark: { fontSize: 20, fontWeight: '700', color: '#7F77DD' },
});
