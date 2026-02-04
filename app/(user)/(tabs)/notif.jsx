import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { firestoreDB } from '../../../firebase';
import { collection, query, orderBy, limit, startAfter, getDocs, doc, writeBatch } from 'firebase/firestore';
import { useIsFocused } from "@react-navigation/native";

const PAGE_SIZE = 10;

const Notif = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const isFocused = useIsFocused();

  // Initial load
  useEffect(() => {
    if (isFocused) {
      fetchNotifications();
    }
  }, [isFocused]);

  const fetchNotifications = async () => {
    setLoading(true);
    const q = query(
      collection(firestoreDB, 'notifications'),
      orderBy('date', 'desc'),
      limit(PAGE_SIZE)
    );
    const snapshot = await getDocs(q);
    const docsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setNotifications(docsData);
    setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
    setHasMore(snapshot.docs.length === PAGE_SIZE);
    setLoading(false);

    // Mark as viewed when loading
    markAllAsViewed(docsData);
  };

  const fetchMore = async () => {
    if (!hasMore || loadingMore) return;
  
    setLoadingMore(true);
  
    // add a small delay to ensure "Loading more..." is visible
    await new Promise(resolve => setTimeout(resolve, 500));
  
    const q = query(
      collection(firestoreDB, 'notifications'),
      orderBy('date', 'desc'),
      startAfter(lastDoc),
      limit(PAGE_SIZE)
    );
  
    const snapshot = await getDocs(q);
    const docsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
    setNotifications(prev => [
      ...prev,
      ...docsData.filter(n => !prev.some(p => p.id === n.id))
    ]);
  
    setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
    setHasMore(snapshot.docs.length === PAGE_SIZE);
    setLoadingMore(false);
  
    markAllAsViewed(docsData);
  };
  

  const markAllAsViewed = async (docs) => {
    const batch = writeBatch(firestoreDB);

    docs.forEach(n => {
      if (!n.isViewed) {
        batch.update(doc(firestoreDB, 'notifications', n.id), { isViewed: true });
      }
    });

    await batch.commit();
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const d = timestamp.toDate();
    const month = d.toLocaleString('en-US', { month: 'short' });
    const day = d.getDate();
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${month}. ${day}, ${year} - ${hours}:${minutes}${ampm}`;
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity key={item.id} style={styles.item}>
      <Text style={styles.text}>{item.content}</Text>
      <Text style={styles.date}>{formatDate(item.date)}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id} 
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20, paddingBottom: 150 }}
          onEndReached={fetchMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore ? (
            <Text style={{ color: '#999', textAlign: 'center', marginVertical: 4, fontFamily: 'Poppins-SemiBold' }}>Loading more...</Text>
          ) : null}
        />
      )}
      {notifications.length === 0 && !loading && (
        <Text style={{ color: '#999', textAlign: 'center', marginTop: 40 }}>No notifications</Text>
      )}
    </View>
  );
};

export default Notif;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  item: {
    backgroundColor: '#242328',
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  text: {
    fontSize: 13,
    fontFamily: 'Poppins-SemiBold',
    color: '#eee',
  },
  date: {
    fontFamily: 'Poppins-Light',
    fontSize: 12,
    color: '#999',
    marginTop: 6,
    textAlign: 'right',
  },
});
