import { colors } from '@/theme/colors';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { styles } from './calendar.styles';
import { useState, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { apiClient } from '@/services/apiClient';
import { useWorkspaceStore } from '@/store/workspaceStore';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

interface CalendarPost {
  id: string;
  caption?: string;
  title?: string;
  scheduled_at?: string;
  platforms?: string[];
}

export default function CalendarScreen() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(today.getDate());

  const workspaceId = useWorkspaceStore((s) => s.currentWorkspace?.id ?? null);

  const monthRange = useMemo(() => {
    const start = `${currentYear}-${pad(currentMonth + 1)}-01`;
    const last = getDaysInMonth(currentYear, currentMonth);
    const end = `${currentYear}-${pad(currentMonth + 1)}-${pad(last)}`;
    return { start, end };
  }, [currentMonth, currentYear]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['calendar', workspaceId, monthRange.start, monthRange.end],
    queryFn: () =>
      apiClient.get<{ posts?: CalendarPost[] } | CalendarPost[]>('/posts/calendar', {
        params: { workspaceId: workspaceId!, startDate: monthRange.start, endDate: monthRange.end },
      }),
    enabled: !!workspaceId,
  });

  const posts: CalendarPost[] = (data as any)?.posts ?? (data as any) ?? [];

  const postsByDate = useMemo(() => {
    const map: Record<string, CalendarPost[]> = {};
    for (const p of posts) {
      if (!p.scheduled_at) continue;
      const key = p.scheduled_at.slice(0, 10);
      (map[key] ||= []).push(p);
    }
    return map;
  }, [posts]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };
  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  const selectedDateStr = `${currentYear}-${pad(currentMonth + 1)}-${pad(selectedDate)}`;
  const selectedPosts = postsByDate[selectedDateStr] ?? [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Calendar</Text>
      </View>

      <View style={styles.monthNav}>
        <TouchableOpacity onPress={goToPrevMonth}>
          <Text style={styles.navArrow}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>
          {MONTHS[currentMonth]} {currentYear}
        </Text>
        <TouchableOpacity onPress={goToNextMonth}>
          <Text style={styles.navArrow}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.weekHeader}>
        {DAYS.map((day) => (
          <View key={day} style={styles.weekDay}>
            <Text style={styles.weekDayText}>{day}</Text>
          </View>
        ))}
      </View>

      <View style={styles.daysGrid}>
        {calendarDays.map((day, index) => {
          const dateStr = day
            ? `${currentYear}-${pad(currentMonth + 1)}-${pad(day)}`
            : '';
          const hasPosts = day && (postsByDate[dateStr]?.length ?? 0) > 0;
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCell,
                day === selectedDate && styles.dayCellSelected,
                day === today.getDate() &&
                  currentMonth === today.getMonth() &&
                  currentYear === today.getFullYear() &&
                  styles.dayCellToday,
              ]}
              onPress={() => day && setSelectedDate(day)}
              disabled={!day}
            >
              <Text style={[styles.dayText, day === selectedDate && styles.dayTextSelected]}>
                {day || ''}
              </Text>
              {hasPosts && <View style={styles.dot} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView style={styles.events}>
        <View style={styles.eventsHeader}>
          <Text style={styles.eventsTitle}>
            {MONTHS[currentMonth]} {selectedDate}, {currentYear}
          </Text>
          <TouchableOpacity
            onPress={() => router.push(`/compose/new?date=${selectedDateStr}` as any)}
            style={styles.newBtn}
          >
            <Text style={styles.newBtnText}>+ New</Text>
          </TouchableOpacity>
        </View>

        {!workspaceId && (
          <Text style={styles.emptyText}>No workspace selected.</Text>
        )}
        {isLoading && <ActivityIndicator color=colors.primary style={{ marginTop: 16 }} />}
        {isError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>Failed to load calendar.</Text>
            <TouchableOpacity onPress={() => refetch()}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
        {!isLoading && !isError && selectedPosts.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No posts scheduled for this date</Text>
          </View>
        )}
        {selectedPosts.map((post) => (
          <TouchableOpacity
            key={post.id}
            style={styles.postCard}
            onPress={() => router.push(`/post/${post.id}` as any)}
          >
            <Text style={styles.postCaption} numberOfLines={2}>
              {post.caption || post.title || 'Untitled post'}
            </Text>
            {post.scheduled_at && (
              <Text style={styles.postTime}>
                {new Date(post.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            )}
            {post.platforms && post.platforms.length > 0 && (
              <Text style={styles.postPlatforms}>{post.platforms.join(', ')}</Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
