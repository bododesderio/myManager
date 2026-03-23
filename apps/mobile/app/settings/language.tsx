import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Espanol' },
  { code: 'fr', name: 'French', nativeName: 'Francais' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Portugues' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'ja', name: 'Japanese', nativeName: 'Nihongo' },
  { code: 'ko', name: 'Korean', nativeName: 'Hangugeo' },
  { code: 'zh', name: 'Chinese', nativeName: 'Zhongwen' },
  { code: 'ar', name: 'Arabic', nativeName: 'Al-Arabiyyah' },
];

export default function LanguageSettingsScreen() {
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  const renderItem = ({ item }: { item: Language }) => (
    <TouchableOpacity
      style={[styles.languageRow, selectedLanguage === item.code && styles.languageRowSelected]}
      onPress={() => setSelectedLanguage(item.code)}
    >
      <View>
        <Text style={styles.languageName}>{item.name}</Text>
        <Text style={styles.nativeName}>{item.nativeName}</Text>
      </View>
      {selectedLanguage === item.code && (
        <Text style={styles.checkmark}>V</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Language</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={languages}
        renderItem={renderItem}
        keyExtractor={(item) => item.code}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backText: {
    fontSize: 16,
    color: '#7F77DD',
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  list: {
    padding: 16,
  },
  languageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  languageRowSelected: {
    borderWidth: 2,
    borderColor: '#7F77DD',
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  nativeName: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  checkmark: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7F77DD',
  },
});
