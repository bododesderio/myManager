import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ReportTemplate {
  id: string;
  title: string;
  description: string;
}

const reportTemplates: ReportTemplate[] = [
  { id: '1', title: 'Performance Overview', description: 'Overall metrics across all platforms' },
  { id: '2', title: 'Engagement Report', description: 'Likes, comments, and shares breakdown' },
  { id: '3', title: 'Audience Growth', description: 'Follower trends over time' },
  { id: '4', title: 'Content Analysis', description: 'Best performing content types' },
];

export default function ReportsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Reports</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Report Templates</Text>
        {reportTemplates.map((template) => (
          <TouchableOpacity key={template.id} style={styles.templateCard}>
            <Text style={styles.templateTitle}>{template.title}</Text>
            <Text style={styles.templateDescription}>{template.description}</Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionTitle}>Recent Reports</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No reports generated yet</Text>
        </View>
      </ScrollView>
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
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
    marginTop: 8,
  },
  templateCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 14,
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
});
