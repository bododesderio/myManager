import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { styles } from './index.styles';
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
