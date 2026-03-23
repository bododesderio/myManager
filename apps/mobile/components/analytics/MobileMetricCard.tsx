import { View, Text, StyleSheet } from 'react-native';

interface MobileMetricCardProps {
  label: string;
  value: string | number;
  change?: string;
  positive?: boolean;
}

export default function MobileMetricCard({ label, value, change, positive = true }: MobileMetricCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {change && (
        <Text style={[styles.change, positive ? styles.positive : styles.negative]}>
          {change}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: 140,
  },
  label: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
    marginBottom: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  change: {
    fontSize: 12,
    fontWeight: '600',
  },
  positive: {
    color: '#4CAF50',
  },
  negative: {
    color: '#F44336',
  },
});
