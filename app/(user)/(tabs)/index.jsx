import { StyleSheet, Text, View, Image, ScrollView, FlatList, TouchableOpacity, Dimensions, Switch, Modal, TextInput, Animated } from 'react-native'
import { useEffect, useState, useRef } from 'react';
import { ref, onValue, set } from 'firebase/database';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { realtimeDB, firestoreDB } from '../../../firebase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { images } from '../../../constants';

const { width } = Dimensions.get('window');

const ThresholdScreen = () => {
  
  const [surfaceTempAvg, setSurfaceTempAvg] = useState(null);
  const [rearSurfaceTempAvg, setRearSurfaceTempAvg] = useState(null);
  const [avgTemp, setAvgTemp] = useState(null);

  const [coolingMode, setCoolingMode] = useState(null);
  const [cleaningMode, setCleaningMode] = useState(null);

  const [lastCleaning, setLastCleaning] = useState(null);

  const [coolingTime, setCoolingTime] = useState(null);

  useEffect(() => {
    
    const surfaceTempAvgRef = ref(realtimeDB, 'Temperature/SurfaceTempAvg');
    const rearSurfaceTempAvgRef = ref(realtimeDB, 'Temperature/RearSurfaceTempAvg');
    const avgTempRef = ref(realtimeDB, 'Temperature/TempAvg');

    const coolingModeRef = ref(realtimeDB, 'Controls/Cooling/CoolingMode');
    const cleaningModeRef = ref(realtimeDB, 'Controls/Cleaning/CleaningMode');
    
    const coolingTimeRef = ref(realtimeDB, 'CoolingTimeRemaining');

    const unsubSurfaceTemp = onValue(surfaceTempAvgRef, snapshot => {
      if (snapshot.exists()) setSurfaceTempAvg(snapshot.val());
    });
    const unsubRearSurfaceTemp = onValue(rearSurfaceTempAvgRef, snapshot => {
      if (snapshot.exists()) setRearSurfaceTempAvg(snapshot.val());
    });
    const unsubAvgTemp = onValue(avgTempRef, snapshot => { 
      if (snapshot.exists()) setAvgTemp(snapshot.val());
    });

    const unsubCoolingMode = onValue(coolingModeRef, snapshot => {
      if (snapshot.exists()) setCoolingMode(snapshot.val());
    });
    const unsubCleaningMode = onValue(cleaningModeRef, snapshot => { 
      if (snapshot.exists()) setCleaningMode(snapshot.val());
    });

    const unsubCoolingTime = onValue(coolingTimeRef, snapshot => { 
      if (snapshot.exists()) setCoolingTime(snapshot.val());
    });

    return () => {
      unsubSurfaceTemp();
      unsubRearSurfaceTemp();
      unsubAvgTemp();

      unsubCoolingMode();
      unsubCleaningMode();

      unsubCoolingTime();
    };
  }, []);

  useEffect(() => {
    const cleaningHistoryRef = collection(firestoreDB, 'cleaningHistory');

    const q = query(
      cleaningHistoryRef,
      orderBy('DateTime', 'desc'),
      limit(1)
    );

    const unsubCleaningHistory = onSnapshot(q, snapshot => {
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        setLastCleaning(doc.data().DateTime.toDate());
      } else {
        setLastCleaning(null);
      }
    });

    return () => {
      unsubCleaningHistory();
    };
  }, []);

  const formatDateTime = (date) => {
    if (!date) return '...';

    const monthNames = ["Jan.", "Feb.", "Mar.", "Apr.", "May.", "Jun.",
                        "Jul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec."];

    const month = monthNames[date.getMonth()];
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;

    return `${month} ${day}, ${year} – ${hours}:${minutes} ${ampm}`;
  };
  
  const formatCoolingTime = (time) => {
    if (time === null || time === undefined) return '...';

    const hours = Number(time);
    if (isNaN(hours)) return '...';

    return `${hours}:00`;

  };
  return (
    <ScrollView 
      style={{ flex: 1 }}
      contentContainerStyle={[
        styles.scrollContent,
        { flexGrow: 1 }
      ]}
      showsVerticalScrollIndicator={false}
    >
      
      <View style={[styles.innerContainer, { flex: 1 }]}>
        <Text style={styles.screenTitle}>Monitoring</Text>
        <Ionicons
          name='radio'
          size={52}
          color='#00bd5f'
          style={{ marginHorizontal: 'auto' }}
        />
        <View style={styles.doubleCardContainer}>
          <View style={styles.card}>
            <View style={styles.valueContainer}>
              <Text numberOfLines={1} adjustsFontSizeToFit style={styles.valueText}>
                {surfaceTempAvg !== null ? (
                  <>
                    {parseFloat(surfaceTempAvg).toFixed(2)}
                    <Text style={{ color: '#ffffff', fontFamily: 'Poppins-Regular', fontSize: 20 }}> °C</Text>
                  </>
                ) : (
                  '...'
                )}
              </Text> 
            </View>
            <View>
              <Text style={styles.cardTitleText}>
                Surface Panel
              </Text>
              <Text style={styles.cardTitleTextBottom}>
                Temperature
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.valueContainer}>
              <Text numberOfLines={1} adjustsFontSizeToFit style={styles.valueText}>
                {rearSurfaceTempAvg !== null ? (
                  <>
                    {parseFloat(rearSurfaceTempAvg).toFixed(2)}
                    <Text style={{ color: '#ffffff', fontFamily: 'Poppins-Regular', fontSize: 20 }}> °C</Text>
                  </>
                ) : (
                  '...'
                )}
              </Text> 
            </View>
            <View>
              <Text style={styles.cardTitleText}>
                Underside Panel
              </Text>
              <Text style={styles.cardTitleTextBottom}>
                Temperature
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.singleCardContainer}>
          <View style={styles.card}>
            <View style={styles.valueContainer}>
              <Text numberOfLines={1} adjustsFontSizeToFit style={styles.valueText}>
                {avgTemp !== null ? (
                  <>
                    {parseFloat(avgTemp).toFixed(2)}
                    <Text style={{ color: '#ffffff', fontFamily: 'Poppins-Regular', fontSize: 20 }}> °C</Text>
                  </>
                ) : (
                  '...'
                )}
              </Text> 
            </View>
            <View>
              <Text style={styles.cardTitleText}>
                Average Temperature
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.doubleCardContainer}>
          <View style={styles.card}>
            <View style={styles.valueContainer}>
              <Text style={styles.contolCardTitle}>Cooling Mode:</Text>
              <Text numberOfLines={1} adjustsFontSizeToFit style={styles.controlCardValue}>
                {coolingMode !== null ? (
                  <>
                    {coolingMode}
                  </>
                ) : (
                  '...'
                )}
              </Text> 
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.valueContainer}>
              <Text style={styles.contolCardTitle}>Cleaning Mode:</Text>
              <Text numberOfLines={1} adjustsFontSizeToFit style={styles.controlCardValue}>
                {cleaningMode !== null ? (
                  <>
                    {cleaningMode}
                  </>
                ) : (
                  '...'
                )}
              </Text> 
            </View>
          </View>
        </View>

        <View style={styles.singleCardContainer}>
          <View style={styles.card}>
            <View style={styles.valueContainer}>
              <Text style={styles.contolCardTitle}>Last Cleaning Performed:</Text>
              <Text numberOfLines={1} adjustsFontSizeToFit style={styles.controlCardValue}>
                {formatDateTime(lastCleaning)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.singleCardContainer}>
          <View style={styles.card}>
            <View style={styles.valueContainer}>
              <Text style={styles.contolCardTitle}>Cooling Time Remaining:</Text>
              <Text numberOfLines={1} adjustsFontSizeToFit style={styles.controlCardValue}>
                {formatCoolingTime(coolingTime)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

export default ThresholdScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    padding: 5,
    paddingBottom: 130,
    flexGrow: 1,
    backgroundColor: '#ffffff'
  },
  screenTitle:{
    fontSize: 40,
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center'
  },
  doubleCardContainer:{
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  singleCardContainer:{
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  card: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 'auto',
    margin: 8,
    gap: 8
  },
  valueContainer:{
    width: '100%',
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 5,
    borderRadius: 20
  },
  valueText:{
    color: '#ffffff',
    fontSize: 30,
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
  },
  cardTitleText:{
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
  },
  cardTitleTextBottom:{
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    marginTop: -5
  },

  // Control
  contolCardTitle:{
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    fontSize: 12,
    color: '#fff'
  },
  controlCardValue:{
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
    fontSize: 16,
    color: '#fff'
  }
})
