import { Tabs } from 'expo-router';
import { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  writeBatch, 
  doc 
} from 'firebase/firestore';
import { firestoreDB } from '../../firebase';
import { Text, View, StyleSheet, Image, TouchableOpacity, FlatList, ScrollView, TouchableWithoutFeedback  } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { images } from '../../constants';

export default function AdminTabsLayout() {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const q = query(
      collection(firestoreDB, 'notifications'),
      orderBy('date', 'desc')
    );
  
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
  
      setNotifications(notifList);
  
      const unread = notifList.filter(n => !n.isViewed).length;
      setUnreadCount(unread);
    });
  
    return () => unsubscribe();
  }, []);

  const markNotificationsAsViewed = async () => {
    const batch = writeBatch(firestoreDB);
  
    notifications.forEach(n => {
      if (!n.isViewed) {
        const notifRef = doc(firestoreDB, 'notifications', n.id);
        batch.update(notifRef, { isViewed: true });
      }
    });
  
    await batch.commit();
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const dateObj = timestamp.toDate();
    return (
      dateObj.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }) +
      ' ' +
      dateObj.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: '#ffffff',
            borderTopWidth: 0,
            elevation: 5,
            height: 70,
            marginHorizontal: 10,
            marginBottom:50,
            borderRadius: 60,
            shadowColor: '#000',
            shadowOpacity: 0.05,
            shadowRadius: 8,
          },
          tabBarShowLabel: true,
          headerStyle: {
            backgroundColor: '#ffffff',
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarItemStyle: {
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 20, // helps center vertically
          },
          headerShown: true,
          headerTitle: '',
          headerLeft: () => (
            <View style={styles.headerContainer}>
              {/* <Image 
                source={images.logo}
                style={styles.imageLogo}
                resizeMode='contain'
              /> */}
              <Text style={styles.appNameText}>Hi, User</Text>
              <Text style={styles.appSubText}>Welcome to your Biogas Monitoring System!</Text>
            </View>
          ),
          headerRight: () => (
            // <View style={{ zIndex: 9999 }}>
            //   <TouchableOpacity
            //     onPress={() => {
            //       setShowDropdown(!showDropdown);
            //       if (!showDropdown) markNotificationsAsViewed();
            //     }}
            //     style={styles.notificationButton}
            //   >
            //     <View style={styles.notificationContainer}>
            //       <Ionicons name="notifications-outline" size={30} color="#fff" />
            //       {unreadCount > 0 && (
            //         <View style={styles.notificationCountContainer}>
            //           <Text style={styles.notificationCountText}>{unreadCount}</Text>
            //         </View>
            //       )}
            //     </View>
            //   </TouchableOpacity>
            // </View>
            <>
            </>
          ),
        }}
      >
        <Tabs.Screen
          name="(tabs)/index"
          options={{
            tabBarIcon: ({ focused }) => (
              <View
                style={{
                  backgroundColor: focused ? '#007AFF' : 'transparent',
                  width: 80,
                  height: 60,
                  borderRadius: 30,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons
                  name={focused ? 'radio' : 'radio-outline'}
                  size={26}
                  color={focused ? '#fff' : '#999'}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="(tabs)/data"
          options={{
            tabBarIcon: ({ focused }) => (
              <View
                style={{
                  backgroundColor: focused ? '#007AFF' : 'transparent',
                  width: 80,
                  height: 60,
                  borderRadius: 30,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons
                  name={focused ? 'analytics' : 'analytics-outline'}
                  size={30}
                  color={focused ? '#fff' : '#999'}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="(tabs)/notif"
          options={{
            tabBarIcon: ({ focused }) => (
              <View
                style={{
                  width: 80,
                  height: 60,
                  borderRadius: 30,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: focused ? '#007AFF' : 'transparent',
                  position: 'relative',
                }}
              >
                <Ionicons
                  name={focused ? 'notifications' : 'notifications-outline'}
                  size={28}
                  color={focused ? '#fff' : '#999'}
                />

                {unreadCount > 0 && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 20,
                      backgroundColor: '#FF3B30',
                      borderRadius: 10,
                      minWidth: 18,
                      height: 18,
                      justifyContent: 'center',
                      alignItems: 'center',
                      paddingHorizontal: 4,
                    }}
                  >
                    <Text
                      style={{
                        color: '#fff',
                        fontSize: 10,
                        fontWeight: 'bold',
                      }}
                    >
                      {unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            ),
          }}
        />


      </Tabs>
    {showDropdown && (
    <View style={styles.dropdownOverlay}>
      <Text style={styles.dropdownHeaderText}>Notifications</Text>
          {notifications.length > 0 ? (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 10 }}
              showsVerticalScrollIndicator={true}
            >
              {notifications.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.dropdownItem}
                  onPress={() => console.log('Notification pressed:', item)}
                >
                  <Text
                    style={[
                      styles.dropdownText,
                      !item.isViewed && styles.unreadText,
                    ]}
                  >
                    {String(item.content)}
                  </Text>
                  <Text style={styles.dateText}>{formatDate(item.date)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.dropdownText}>No notifications</Text>
          )}
      </View>
    )}

    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'col',
    // alignItems: 'center',
    marginLeft: 10,
  },
  imageLogo: {
    width: 36,
    height: 36,
  },
  appNameText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 18,
    marginLeft: 6,
    color: '#000',
  },
  appSubText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    marginLeft: 6,
    color: '#6b6b6b',
  },
  notificationButton: {
    marginRight: 16,
  },
  notificationContainer: {
    position: 'relative',
  },
  notificationCountContainer: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#1654ff',
    borderRadius: 10,
    width: 18,              // fixed size
    height: 18,
    // minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationCountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  dropdown: {
    position: 'absolute',
    top: 35,
    right: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    width: 300,
    height: 300,         // FIXED height for scroll
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 9999,
    overflow: 'hidden',  // capture scroll gestures
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 80,
    right: 15,
    width: 300,
    height: 300,
    backgroundColor: '#242328', // dark theme
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 9999,
    borderWidth: 1,
    borderColor: '#333', // subtle border
  },
  dropdownHeaderText: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  dropdownItem: {
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderColor: '#3a3a3a',
  },
  dropdownText: {
    fontSize: 14,
    color: '#e0e0e0',
    fontFamily: 'Poppins-Regular',
  },
  unreadText: {
    color: '#fff',
    fontWeight: '600',
  },
  dateText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'right',
    marginTop: 4,
    fontFamily: 'Poppins-Light',
  },  
});
