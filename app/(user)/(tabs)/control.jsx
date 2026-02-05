import { StyleSheet, Text, View, Image, ScrollView, FlatList, TouchableOpacity, Dimensions, Switch, Modal, TextInput, Animated } from 'react-native'
import { useEffect, useState, useRef } from 'react';
import { ref, onValue, set } from 'firebase/database';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { realtimeDB, firestoreDB } from '../../../firebase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import ToastManager, { Toast } from 'toastify-react-native'

import { images } from '../../../constants';

const { width } = Dimensions.get('window');

const ControlScreen = () => {
  const [coolingStatus, setCoolingStatus] = useState(null);
  const [cleaningStatus, setCleaningStatus] = useState(null);
  
  const [coolingMode, setCoolingMode] = useState(null);
  const [cleaningMode, setCleaningMode] = useState(null);

  const [tempAvg, setTempAvg] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [cleaningModalVisible, setCleaningModalVisible] = useState(false);

  useEffect(() => {
    const coolingRef = ref(realtimeDB, 'Controls/Cooling/CoolingStatus');
    const cleaningRef = ref(realtimeDB, 'Controls/Cleaning/CleaningStatus');
    const tempRef = ref(realtimeDB, 'Temperature/TempAvg');

    const coolingModeRef = ref(realtimeDB, 'Controls/Cooling/CoolingMode');
    const cleaningModeRef = ref(realtimeDB, 'Controls/Cleaning/CleaningMode');

    const unsubCooling = onValue(coolingRef, snapshot => {
      if (snapshot.exists()) setCoolingStatus(snapshot.val());
    });

    const unsubCleaning = onValue(cleaningRef, snapshot => {
      if (snapshot.exists()) setCleaningStatus(snapshot.val());
    });

    const unsubTemp = onValue(tempRef, snapshot => {
      if (snapshot.exists()) setTempAvg(snapshot.val());
    });

    const unsubCoolingMode = onValue(coolingModeRef, snapshot => {
      if (snapshot.exists()) setCoolingMode(snapshot.val());
    });

    const unsubCleaningMode = onValue(cleaningModeRef, snapshot => {
      if (snapshot.exists()) setCleaningMode(snapshot.val());
    });

    return () => {
      unsubCooling();
      unsubCleaning();
      unsubTemp();

      unsubCoolingMode();
      unsubCleaningMode();
    };
  }, []);

  const toggleCooling = () => {
    const newStatus = coolingStatus === 'Active' ? 'Inactive' : 'Active';
    set(ref(realtimeDB, 'Controls/Cooling/CoolingStatus'), newStatus);
  };

  const toggleCleaning = () => {
    const newStatus = cleaningStatus === 'Active' ? 'Inactive' : 'Active';
    set(ref(realtimeDB, 'Controls/Cleaning/CleaningStatus'), newStatus);
  };

  const handleCoolingPress = () => {
    if (coolingMode !== 'Manual') {
      
      Toast.show({
          type: 'error',
          text1: 'Warning!',
          text2: 'Please switch Cooling Mode to Manual first.',
          visibilityTime: 5000,
      });
      
      return;
    }

    if (coolingStatus !== 'Active' && tempAvg !== null && tempAvg > 35) {
      setModalVisible(true);
    } else {
      toggleCooling();
    }
  };

  const handleCleaningPress = () => {
    if (cleaningMode !== 'Manual') {

      Toast.show({
          type: 'error',
          text1: 'Warning!',
          text2: 'Please switch Cleaning Mode to Manual first.',
          visibilityTime: 5000,
      });

      return;
    }

    const now = new Date();
    const options = { timeZone: 'Asia/Manila', hour12: false, hour: 'numeric', minute: 'numeric', second: 'numeric' };
    const phTimeString = now.toLocaleString('en-US', options);

    const hours = parseInt(phTimeString.split(':')[0]); 

    // Check if time is during strong sunlight (6AM - 5PM)
    if (cleaningStatus !== 'Active' && hours >= 6 && hours <= 17) {
      setCleaningModalVisible(true);
    } else {
      toggleCleaning();
    }
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
        <Text style={styles.screenTitle}>Manual</Text>
        <Text style={styles.screenTitleBottom}>Controls</Text>
        
        <View style={styles.doubleCardContainer}>
          <View style={styles.card}>
            <View style={styles.valueContainerMode}>
              <Text style={styles.contolCardTitle}>Cooling Mode:</Text>
              <Switch
                value={coolingMode === 'Automatic'}
                onValueChange={(val) => {
                  const newMode = val ? 'Automatic' : 'Manual';
                  set(ref(realtimeDB, 'Controls/Cooling/CoolingMode'), newMode);
                }}
                trackColor={{ false: '#ccc', true: '#38b6ff' }}
                thumbColor={coolingMode === 'Automatic' ? '#00bf62' : '#f4f3f4'}
              />
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
            <View style={styles.valueContainerMode}>
              <Text style={styles.contolCardTitle}>Cleaning Mode:</Text>
              <Switch
                value={cleaningMode === 'Automatic'}
                onValueChange={(val) => {
                  const newMode = val ? 'Automatic' : 'Manual';
                  set(ref(realtimeDB, 'Controls/Cleaning/CleaningMode'), newMode);
                }}
                trackColor={{ false: '#ccc', true: '#38b6ff' }}
                thumbColor={cleaningMode === 'Automatic' ? '#00bf62' : '#f4f3f4'}
              />
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
            <TouchableOpacity 
              style={[styles.valueContainer, { backgroundColor: coolingStatus === 'Active' ? '#38b6ff' : '#00bf62' }]} 
              onPress={handleCoolingPress}
            >
              <Text style={styles.valueText}>
                {coolingStatus === 'Active' ? 'Cooling On' : 'Activate Cooling'}
              </Text>
            </TouchableOpacity>
            <View>
              <Text style={styles.cardTitleText}>
                Cooling System Status: 
              </Text>
              <Text style={styles.cardTitleTextBottom}>
                {coolingStatus}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.singleCardContainer}>
          <View style={styles.card}>
            <TouchableOpacity 
              style={[styles.valueContainer, { backgroundColor: cleaningStatus === 'Active' ? '#38b6ff' : '#00bf62' }]} 
              onPress={handleCleaningPress}
            >
              <Text style={styles.valueText}>
                {cleaningStatus === 'Active' ? 'Cleaning On' : 'Activate Cleaning'}
              </Text>
            </TouchableOpacity>
            <View>
              <Text style={styles.cardTitleText}>
                Cleaning System Status: 
              </Text>
              <Text style={styles.cardTitleTextBottom}>
                {cleaningStatus}
              </Text>
            </View>
          </View>
        </View>
      </View>
      
      {/* Cooling Modal Warning */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Ionicons
              name='warning'
              size={30}
              color='orange'
              style={{ marginHorizontal: 'auto' }}
            />
            <Text style={styles.modalTypeTitle}>
              Warning
            </Text>
            
            <Text style={styles.modalTitle}>
              Panel temperature is below the effective cooling range. Cooling at this temperature may waste energy without improving efficiency.
            </Text>
          
            <Text style={styles.modalText}>
              Cooling is recommended only when temperature is <Text style={styles.boldText}>35 °C</Text> or higher.
            </Text>
            <Text style={[styles.modalText, styles.boldText]}>
              Do you want to proceed anyway?
            </Text>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  toggleCooling(); // Proceed anyway
                }}
                style={[styles.modalButton, styles.modalProceedButton]}
              >
                <Text style={styles.modalButtonText}>Yes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[styles.modalButton, styles.modalCancelButton]}
              >
                <Text style={styles.modalButtonTextCancel}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Cleaning Modal Warning */}
      <Modal
        visible={cleaningModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCleaningModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Ionicons
              name='warning'
              size={30}
              color='orange'
              style={{ alignSelf: 'center', marginBottom: 10 }}
            />
            <Text style={styles.modalTypeTitle}>Warning</Text>

            <Text style={styles.modalTitle}>
              Cleaning during strong sunlight may reduce power output.
            </Text>

            <Text style={styles.modalText}>
              Recommended cleaning time: <Text style={styles.boldText}>after sunset</Text> or <Text style={styles.boldText}>early morning</Text>.
            </Text>

            <Text style={[styles.modalText, styles.boldText]}>
              Do you want to proceed anyway?
            </Text>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                onPress={() => {
                  setCleaningModalVisible(false);
                  toggleCleaning();
                }}
                style={[styles.modalButton, styles.modalProceedButton]}
              >
                <Text style={styles.modalButtonText}>Yes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setCleaningModalVisible(false)}
                style={[styles.modalButton, styles.modalCancelButton]}
              >
                <Text style={styles.modalButtonTextCancel}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      <ToastManager
        theme='light'
        showProgressBar={true}
        showCloseIcon={true}
        animationStyle='fade'
      />
    </ScrollView>
  )
}
export default ControlScreen

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
  screenTitleBottom:{
    fontSize: 40,
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
    marginTop: -14,
    marginBottom: 20
  },
  doubleCardContainer:{
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 20
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
    width: '70%',
    backgroundColor: '#00bf62',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 15,
    borderRadius: 20
  },
  valueText:{
    color: '#ffffff',
    fontSize: 24,
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
  },
  cardTitleText:{
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
  },
  cardTitleTextBottom:{
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
  },

  // Control
  valueContainerMode:{
    width: '100%',
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 14,
    borderRadius: 20
  },
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
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16
  },
  modalTypeTitle:{
    fontSize: 24,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 10,
    textAlign: 'center',
    color: 'orange'
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    marginBottom: 20,
    textAlign: 'center',
  },
  boldText:{
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    paddingVertical: 5,
    borderRadius: 10,
    flex: 1,
  },
  modalProceedButton: {
    backgroundColor: '#00bf62',
    marginRight: 5,
  },
  modalCancelButton: {
    backgroundColor: '#ff3131',
    marginLeft: 5,
  },
  modalButtonText: {
    color: 'white',
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 24,
    marginTop: 4
  },
  modalButtonTextCancel: {
    textAlign: 'center',
    color: '#000',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 24,
    marginTop: 4
  },
})