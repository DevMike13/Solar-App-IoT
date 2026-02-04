import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  Modal,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { firestoreDB } from '../../../firebase';
import { collection, query, orderBy, onSnapshot, where, Timestamp } from 'firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LineChart } from 'react-native-gifted-charts';

const { width } = Dimensions.get('window');

const DataScreen = () => {
  const [sensorData, setSensorData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedData, setSelectedData] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const [selectedRange, setSelectedRange] = useState('24h');
  const [rangeLabel, setRangeLabel] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showPicker, setShowPicker] = useState({ type: null, visible: false });

  const getCutoffDate = () => {
    const now = new Date();
  
    if (selectedRange === '24h') {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
  
    if (selectedRange === '7d') {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 6);
      return new Date(sevenDaysAgo.getFullYear(), sevenDaysAgo.getMonth(), sevenDaysAgo.getDate());
    }
  
    if (selectedRange === '30d') {
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 29);
      return new Date(thirtyDaysAgo.getFullYear(), thirtyDaysAgo.getMonth(), thirtyDaysAgo.getDate());
    }
  
    if (selectedRange === 'custom') {
      return startDate || now;
    }
  
    return null;
  };

  const sanitizeData = (data) => {
    return data.map((item) => {
      const temp =
        item.temperature < -50 || item.temperature > 100
          ? null 
          : parseFloat(item.temperature.toFixed(2));
      const pres =
        item.pressure < 0 || item.pressure > 200
          ? null 
          : parseFloat(item.pressure.toFixed(2));
  
      return {
        ...item,
        temperature: temp,
        pressure: pres,
      };
    });
  };

  const aggregatePerDay = (data, key) => {
    const map = new Map();
  
    data.forEach((item) => {
      const dateKey = item.timestamp.toISOString().split('T')[0];
      if (!map.has(dateKey)) {
        map.set(dateKey, { sum: 0, count: 0 });
      }
  
      const entry = map.get(dateKey);
      if (item[key] !== null && item[key] !== undefined) {
        entry.sum += item[key];
        entry.count += 1;
      }
      map.set(dateKey, entry);
    });
  
    const result = [];
    for (const [dateStr, { sum, count }] of map) {
      result.push({
        timestamp: new Date(dateStr),
        [key]: count > 0 ? parseFloat((sum / count).toFixed(2)) : null,
        label: dateStr,
      });
    }
  
    return result.sort((a, b) => a.timestamp - b.timestamp);
  };
  
  // Fetch Firestore data
  useEffect(() => {
    const cutoff = getCutoffDate();
    if (!cutoff) return;
  
    const q = query(
      collection(firestoreDB, 'sensorData'),
      orderBy('timestamp', 'asc')
    );
  
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs
        .map((doc) => {
          const d = doc.data();
          let ts;
          if (d.timestamp && d.timestamp.seconds !== undefined) {
            ts = new Date(d.timestamp.seconds * 1000);
          } else if (d.timestamp) {
            ts = d.timestamp > 1000000000000 ? new Date(d.timestamp) : new Date(d.timestamp * 1000);
          } else {
            ts = new Date();
          }
  
          return {
            timestamp: ts,
            temperature: d.temperature ?? null,
            pressure: d.pressure ?? null,
            label: `${ts.toLocaleString('en-US', { month: 'short', day: 'numeric' })}-${ts.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })}`,
          };
        })
        .filter((item) => item.timestamp >= cutoff);
  
      const sanitized = sanitizeData(data); // apply sanitization
      setSensorData(sanitized);
      setLoading(false);
    });
  
    return () => unsubscribe();
  }, [selectedRange, startDate, endDate]);
  
  
  // Filter data by range
  useEffect(() => {
    if (!sensorData || sensorData.length === 0) {
      setFilteredData([]);
      return;
    }
  
    const now = new Date();
    let filtered = [];
  
    if (selectedRange === 'custom' && startDate && endDate) {
      filtered = sensorData.filter(
        (item) => item.timestamp >= startDate && item.timestamp <= endDate
      );
    } else if (selectedRange === '24h') {
      const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      filtered = sensorData.filter((item) => item.timestamp >= cutoff);
    } else if (selectedRange === '7d') {
      const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = sensorData.filter((item) => item.timestamp >= cutoff);
    } else if (selectedRange === '30d') {
      const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const last30Days = sensorData.filter((item) => item.timestamp >= cutoff);
  
      // Aggregate temperature and pressure per day
      const tempData = aggregatePerDay(last30Days, 'temperature');
      const presData = aggregatePerDay(last30Days, 'pressure');
  
      // Merge temp and pressure into same array
      filtered = tempData.map((t, i) => ({
        timestamp: t.timestamp,
        temperature: t.temperature,
        pressure: presData[i]?.pressure ?? null,
        label: t.timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      }));
    }
  
    setFilteredData(filtered);
  }, [selectedRange, sensorData, startDate, endDate]);
  

  useEffect(() => {
    if (!filteredData || filteredData.length === 0) {
      setRangeLabel('');
      return;
    }

    const first = filteredData[0].timestamp;
    const last = filteredData[filteredData.length - 1].timestamp;

    const formatDate = (date) =>
      date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    if (selectedRange === '24h') {
      setRangeLabel(formatDate(last));
    } else if (['7d', '30d', 'custom'].includes(selectedRange)) {
      setRangeLabel(`${formatDate(first)} - ${formatDate(last)}`);
    }
  }, [filteredData, selectedRange]);
  
  

  const toChartData = (key, unit = '') => {
    if (!filteredData || filteredData.length === 0) return [];
  
    return filteredData
      .filter((item) => item[key] !== null && item[key] !== undefined)
      .reverse()
      .map((item) => ({
        value: item[key],
        label: item.label ?? '',
        dataPointText: `${item[key]}${unit}`,
      }));
  };
  
  const handlePointPress = (item, title) => {
    setSelectedData({ ...item, title });
    setModalVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const renderChart = (title, data, color) => (
    <View style={styles.chartContainer} key={title}>
      <Text style={styles.chartTitle}>{title}</Text>
      <LineChart
        data={data}
        width={width * 0.9}
        height={220}
        color1={color}
        curved
        areaChart
        startFillColor={`${color}55`}
        endFillColor={`${color}10`}
        startOpacity={0.8}
        endOpacity={0.1}
        thickness={4}
        hideDataPoints={false}
        pressPointEnabled
        focusEnabled
        dataPointsRadius={10}
        focusedDataPointRadius={8}
        focusedDataPointColor={color}
        showValuesAsDataPointsText
        textColor1="#fff"
        textShiftY={30}
        textShiftX={-5}
        textFontSize={12}
        spacing={75}
        onPress={(item) => handlePointPress(item, title)}
        xAxisLabelTextStyle={{
          color: '#fff',
          fontSize: 10,
          textAlign: 'center',
          fontFamily: 'Poppins-Regular',
        }}
        yAxisTextStyle={{ color: '#fff', fontSize: 10, fontFamily: 'Poppins-SemiBold' }}
        noOfSections={5}
      />
    </View>
  );

  const ranges = [
    { label: '1D', value: '24h' },
    { label: '1W', value: '7d' },
    { label: '1M', value: '30d' },
    { label: 'Custom', value: 'custom' },
  ];

  const showDatePicker = (type) => {
    setShowPicker({ type, visible: true });
  };

  const onDateChange = (event, selectedDate) => {
    setShowPicker({ type: null, visible: false });
    if (!selectedDate) return;
    if (showPicker.type === 'start') setStartDate(selectedDate);
    if (showPicker.type === 'end') setEndDate(selectedDate);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Temperature & Pressure History</Text>

        {/* Date Range Buttons */}
        <View style={styles.rangeContainer}>
          {ranges.map((r) => (
            <TouchableOpacity
              key={r.value}
              style={[
                styles.rangeButton,
                selectedRange === r.value && styles.activeRangeButton,
              ]}
              onPress={() => setSelectedRange(r.value)}
            >
              <Text
                style={[
                  styles.rangeText,
                  selectedRange === r.value && styles.activeRangeText,
                ]}
              >
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.dateRangeText}>{rangeLabel}</Text>

        {selectedRange === 'custom' && (
          <View style={styles.customRangeWrapper}>
            <View style={styles.dateGroup}>
              <Text style={styles.dateLabel}>From</Text>
              <TouchableOpacity
                style={styles.dateButtonModern}
                onPress={() => showDatePicker('start')}
              >
                <Text style={styles.dateTextModern}>
                  {startDate
                    ? startDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Select'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dateGroup}>
              <Text style={styles.dateLabel}>To</Text>
              <TouchableOpacity
                style={styles.dateButtonModern}
                onPress={() => showDatePicker('end')}
              >
                <Text style={styles.dateTextModern}>
                  {endDate
                    ? endDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Select'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {showPicker.visible && (
          <DateTimePicker
            value={new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
          />
        )}

        {loading ? (
          <ActivityIndicator size="large" color="#fff" style={{ marginTop: 40 }} />
        ) : filteredData.length === 0 ? (
          <Text style={styles.noData}>No data found</Text>
        ) : (
          <>
            {renderChart('Temperature (°C)', toChartData('temperature', '°C'), '#3b82f6')}
            {renderChart('Pressure (%)', toChartData('pressure', '%'), '#ef4444')}
          </>
        )}
      </ScrollView>

      <Modal transparent visible={modalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContent, { opacity: fadeAnim }]}>
            {selectedData && (
              <>
                <Text style={styles.modalTitle}>{selectedData.title}</Text>
                <Text style={styles.modalValue}>Value: {selectedData.value}</Text>
                <Text style={styles.modalTime}>{selectedData.label}</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    Animated.timing(fadeAnim, {
                      toValue: 0,
                      duration: 150,
                      useNativeDriver: true,
                    }).start(() => setModalVisible(false));
                  }}
                >
                  <Text style={styles.closeText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

export default DataScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', },
  scrollContent: { alignItems: 'center', paddingTop: 30, paddingBottom: 100 },
  title: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 10,
    color: '#fff'
  },
  rangeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  rangeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#232227',
    marginHorizontal: 6,
    marginBottom: 6,
  },
  activeRangeButton: {
    backgroundColor: '#1654ff',
    borderColor: '#1654ff',
  },
  rangeText: {
    fontFamily: 'Poppins-SemiBold',
    color: '#fff',
    fontSize: 14,
    marginTop: 2,
  },
  activeRangeText: { color: '#fff' },
  customRangeWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#242328',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginVertical: 10,
    width: '90%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  dateGroup: { alignItems: 'center', flex: 1 },
  dateLabel: { fontFamily: 'Poppins-Medium', fontSize: 12, color: '#555', marginBottom: 4 },
  dateButtonModern: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 8,
    paddingHorizontal: 14,
    width: '90%',
    alignItems: 'center',
  },
  dateTextModern: { fontFamily: 'Poppins-SemiBold', fontSize: 13, color: '#111' },
  chartContainer: { marginBottom: 40, alignItems: 'center' },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
    fontFamily: 'Poppins-Light',
    color: '#fff'
  },
  noData: {
    fontSize: 16,
    color: '#999',
    fontFamily: 'Poppins-SemiBold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.8,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 10,
  },
  modalTitle: { fontSize: 18, fontFamily: 'Poppins-Bold', color: '#111' },
  modalValue: {
    fontSize: 16,
    marginTop: 10,
    color: '#3b82f6',
    fontFamily: 'Poppins-Regular',
  },
  modalTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    fontFamily: 'Poppins-SemiBold',
  },
  closeButton: {
    marginTop: 15,
    backgroundColor: '#3b82f6',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  closeText: { color: '#fff', fontFamily: 'Poppins-SemiBold' },
  dateRangeText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#fff',
    marginBottom: 10,
  },
});
