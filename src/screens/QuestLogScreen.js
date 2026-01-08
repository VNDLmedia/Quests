import React from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import { GlassCard } from '../components';

const QuestLogScreen = () => {
  const quests = [
    { id: 1, title: 'Der goldene Becher', description: 'Finde den verlorenen Becher im Stadtpark.', xp: 500 },
    { id: 2, title: 'NPC Rekrutierung', description: 'Scanne 3 andere User ein.', xp: 300 },
    { id: 3, title: 'Stadtwache', description: 'Bewege dich 5km in deinem Viertel.', xp: 1000 },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Aktive Quests</Text>
      {quests.map((quest) => (
        <GlassCard key={quest.id} style={styles.questCard}>
          <Text style={styles.questTitle}>{quest.title}</Text>
          <Text style={styles.questDesc}>{quest.description}</Text>
          <Text style={styles.questXp}>Belohnung: {quest.xp} XP</Text>
        </GlassCard>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 25,
  },
  questCard: {
    marginBottom: 15,
  },
  questTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  questDesc: {
    color: '#94a3b8',
    fontSize: 14,
    marginVertical: 8,
  },
  questXp: {
    color: '#38bdf8',
    fontWeight: '600',
  },
});

export default QuestLogScreen;

