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
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
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

  const [selectedRange, setSelectedRange] = useState('1D'); // '1D', '2D', '3D', 'Custom'
  const [singleDate, setSingleDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  // Fetch Firestore data
  useEffect(() => {
    const q = query(collection(firestoreDB, 'sensorData'), orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => {
        const d = doc.data();
        // Simplified timestamp parsing
        const ts = d.timestamp?.toDate ? d.timestamp.toDate() : new Date(d.timestamp);

        const temp =
          d.temperature < -50 || d.temperature > 100 ? null : parseFloat(d.temperature.toFixed(2));

        return {
          timestamp: ts,
          temperature: temp,
          label: `${ts.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
          })}-${ts.toLocaleTimeString('en-US', {
            hour: 'numeric',
            hour12: true,
          })}`,
        };
      });

      setSensorData(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter data based on selected range or custom single date
  useEffect(() => {
    if (!sensorData || sensorData.length === 0) {
      setFilteredData([]);
      return;
    }

    const now = new Date();
    let cutoff;

    if (selectedRange === '1D') {
      cutoff = new Date(now);
      cutoff.setDate(now.getDate() - 1); // 1 day ago
      cutoff.setHours(0, 0, 0, 0); // start of day
    } else if (selectedRange === '2D') {
      cutoff = new Date(now);
      cutoff.setDate(now.getDate() - 2);
      cutoff.setHours(0, 0, 0, 0);
    } else if (selectedRange === '3D') {
      cutoff = new Date(now);
      cutoff.setDate(now.getDate() - 3);
      cutoff.setHours(0, 0, 0, 0);
    } else if (selectedRange === 'Custom') {
      const startOfDay = new Date(singleDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(singleDate);
      endOfDay.setHours(23, 59, 59, 999);

      setFilteredData(
        sensorData.filter((item) => item.timestamp >= startOfDay && item.timestamp <= endOfDay)
      );
      return;
    }

    setFilteredData(sensorData.filter((item) => item.timestamp >= cutoff));
  }, [sensorData, selectedRange, singleDate]);

  const toChartData = () => {
    if (!filteredData || filteredData.length === 0) return [];

    return filteredData
      .filter((item) => item.temperature !== null)
      .map((item) => ({
        value: item.temperature,
        label: item.label ?? '',
        dataPointText: `${item.temperature}°C`,
      }));
  };

  const handlePointPress = (item, title) => {
    setSelectedData({ ...item, title });
    setModalVisible(true);
    Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
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
        thickness={4}
        hideDataPoints={false}
        pressPointEnabled
        focusEnabled
        dataPointsRadius={8}
        focusedDataPointRadius={6}
        focusedDataPointColor={color}
        showValuesAsDataPointsText
        textColor1="#000"
        textShiftY={30}
        textShiftX={-5}
        textFontSize={12}
        spacing={75}
        isAnimated
        onPress={(item) => handlePointPress(item, title)}
        xAxisLabelRotation={45}
        xAxisLabelTextStyle={{ color: '#000', fontSize: 8, fontWeight: 'bold', marginLeft: 10 }}
        yAxisTextStyle={{ color: '#000', fontSize: 10 }}
        noOfSections={5}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>History</Text>

        <View style={styles.rangeContainer}>
          {['1D', '2D', '3D', 'Custom'].map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.rangeButton, selectedRange === r && styles.activeRangeButton]}
              onPress={() => setSelectedRange(r)}
            >
              <Text style={[styles.rangeText, selectedRange === r && styles.activeRangeText]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom single date picker */}
        {selectedRange === 'Custom' && (
          <TouchableOpacity
            style={styles.dateButtonModern}
            onPress={() => setShowPicker(true)}
          >
            <Text style={styles.dateTextModern}>
              {singleDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </TouchableOpacity>
        )}

        {showPicker && (
          <DateTimePicker
            value={singleDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, date) => {
              setShowPicker(false);
              if (date) setSingleDate(date);
            }}
          />
        )}

        {loading ? (
          <ActivityIndicator size="large" color="#fff" style={{ marginTop: 40 }} />
        ) : filteredData.length === 0 ? (
          <Text style={styles.noData}>No data found</Text>
        ) : (
          renderChart('Temperature (°C)', toChartData(), '#3b82f6')
        )}
      </ScrollView>

      {/* Modal */}
      <Modal transparent visible={modalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContent, { opacity: fadeAnim }]}>
            {selectedData && (
              <>
                <Text style={styles.modalTitle}>{selectedData.title}</Text>
                <Text style={styles.modalValue}>Value: {selectedData.value}°C</Text>
                <Text style={styles.modalTime}>{selectedData.label}</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(
                      () => setModalVisible(false)
                    );
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
  container: { flex: 1, backgroundColor: '#ffffff' },
  scrollContent: { alignItems: 'center', paddingTop: 30, paddingBottom: 100 },
  title: { fontSize: 40, fontFamily: 'Poppins-SemiBold', marginBottom: 10, color: '#000' },
  rangeContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 10, flexWrap: 'wrap' },
  rangeButton: {
    paddingTop: 6,
    paddingBottom: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#232227',
    marginHorizontal: 6,
    marginBottom: 6,
  },
  activeRangeButton: { backgroundColor: '#1654ff', borderColor: '#1654ff' },
  rangeText: { fontFamily: 'Poppins-SemiBold', color: '#fff', fontSize: 14 },
  activeRangeText: { color: '#fff' },
  dateButtonModern: {
    backgroundColor: '#000',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 8,
    paddingHorizontal: 14,
    width: '60%',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateTextModern: { fontFamily: 'Poppins-SemiBold', fontSize: 13, color: '#fff', marginTop: 3 },
  chartContainer: { marginBottom: 40, alignItems: 'center' },
  chartTitle: { fontSize: 14, fontWeight: '600', marginTop: 10, color: '#fff' },
  noData: { 
    width: '80%',
    fontSize: 16, 
    color: '#999', 
    fontFamily: 'Poppins-SemiBold',
    borderWidth: 1,
    borderColor: '#999',
    borderStyle: 'dashed',
    paddingTop: 30,
    paddingBottom: 25,
    paddingHorizontal: 10,
    borderRadius: 8,
    textAlign: 'center',
    marginVertical: 20,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: width * 0.8, backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center', elevation: 10 },
  modalTitle: { fontSize: 18, fontFamily: 'Poppins-Bold', color: '#111' },
  modalValue: { fontSize: 16, marginTop: 10, color: '#3b82f6', fontFamily: 'Poppins-Regular' },
  modalTime: { fontSize: 14, color: '#666', marginTop: 4, fontFamily: 'Poppins-SemiBold' },
  closeButton: { marginTop: 15, backgroundColor: '#3b82f6', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20 },
  closeText: { color: '#fff', fontFamily: 'Poppins-SemiBold' },
});
