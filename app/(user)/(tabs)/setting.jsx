import { StyleSheet, Text, View, Image, ScrollView, FlatList, TouchableOpacity, Dimensions, Switch, Modal, TextInput, Animated } from 'react-native'
import { useEffect, useState, useRef } from 'react';
import { ref, onValue, set } from 'firebase/database';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { realtimeDB, firestoreDB } from '../../../firebase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import ToastManager, { Toast } from 'toastify-react-native'

const SettingScreen = () => {
  const [autoCleaningInterval, setAutoCleaningInterval] = useState(null);
  const [manualCoolingDuration, setManualCoolingDuration] = useState(null);
  const [autoCoolingTemp, setAutoCoolingTemp] = useState(null);
  const [autoCleaningTime, setAutoCleaningTime] = useState(null);

  const [autoCleanIntervalModal, setAutoCleanIntervalModal] = useState(false);
  const [manualCoolingDurationModal, setManualCoolingDurationModal] = useState(false);
  const [autoCoolingTempModal, setAutoCoolingTempModal] = useState(false);
  const [autoCleaningTimeModal, setAutoCleaningTimeModal] = useState(false);

  const [inputAutoCleanInterval, setInputAutoCleanInterval] = useState('');
  const [inputManualCoolingDuration, setInputManualCoolingDuration] = useState('');
  const [inputAutoCoolingTemp, setInputAutoCoolingTemp] = useState('');
  const [inputAutoCleaningTime, setInputAutoCleaningTime] = useState('');

  const [isFocusedACI, setIsFocusedACI] = useState(false);
  const [isFocusedMCD, setIsFocusedMCD] = useState(false);
  const [isFocusedACAT, setIsFocusedACAT] = useState(false);
  const [isFocusedACLAT, setIsFocusedACLAT] = useState(false);

  // CONFIRMATION MODAL
  const [confirmAutoCleaningIntModal, setConfirmAutoCleaningIntModal] = useState(false);
  const [pendingAutoCleaningInt, setPendingAutoCleaningInt] = useState(null);

  const [confirmManualCoolingDurModal, setConfirmManualCoolingDurModal] = useState(false);
  const [pendingManualCoolingDur, setPendingManualCoolingDur] = useState(null);

  const [confirmAutoCoolingTempModal, setConfirmAutoCoolingTempModal] = useState(false);
  const [pendingAutoCoolingTemp, setPendingAutoCoolingTemp] = useState(null);

  const [confirmAutoCleaningTimeModal, setConfirmAutoCleaningTimeModal] = useState(false);
  const [pendingAutoCleaningTime, setPendingAutoCleaningTime] = useState(null);

  useEffect(() => {
    const autoCleanIntervalRef = ref(realtimeDB, 'AutomaticCleaningInterval');
    const manualCoolingDurationRef = ref(realtimeDB, 'ManualCoolingDuration');
    const autoCoolingTempRef = ref(realtimeDB, 'AutomaticCoolingActivationTemp');
    const autoCleaningTimeRef = ref(realtimeDB, 'AutomaticCleaningActivationTime');

    const unsub1 = onValue(autoCleanIntervalRef, snap => {
      if (snap.exists()) setAutoCleaningInterval(snap.val());
    });

    const unsub2 = onValue(manualCoolingDurationRef, snap => {
      if (snap.exists()) setManualCoolingDuration(snap.val());
    });

    const unsub3 = onValue(autoCoolingTempRef, snap => {
      if (snap.exists()) setAutoCoolingTemp(snap.val());
    });

    const unsub4 = onValue(autoCleaningTimeRef, snap => {
      if (snap.exists()) setAutoCleaningTime(snap.val());
    });

    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
    };
  }, []);

  const openAutoCleanIntervalModal = () => {
    setInputAutoCleanInterval(String(autoCleaningInterval ?? ''));
    setAutoCleanIntervalModal(true);
  };

  const openManualCoolingDurationModal = () => {
    setInputManualCoolingDuration(String(manualCoolingDuration ?? ''));
    setManualCoolingDurationModal(true);
  };

  const openAutoCoolingTempModal = () => {
    setInputAutoCoolingTemp(String(autoCoolingTemp ?? ''));
    setAutoCoolingTempModal(true);
  };

  const openAutoCleaningTimeModal = () => {
    setInputAutoCleaningTime(String(autoCleaningTime ?? ''));
    setAutoCleaningTimeModal(true);
  };

  const saveAutoCleaningInterval = () => {
    const value = parseInt(inputAutoCleanInterval);

    if (isNaN(value) || value < 1 || value > 30) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Interval',
        text2: 'Allowed range: 1–30 days',
      });
      return;
    }

    if (value > 14) {
      setPendingAutoCleaningInt(value);
      setConfirmAutoCleaningIntModal(true);
      return;
    }

    set(ref(realtimeDB, 'AutomaticCleaningInterval'), value);     
    setAutoCleanIntervalModal(false);
  };
  const handleAutoCleaningIntervalInput = (text) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setInputAutoCleanInterval(cleaned);
  };

  const saveManualCoolingDuration = () => {
    const value = parseInt(inputManualCoolingDuration);

    if (isNaN(value) || value < 1 || value > 120) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Duration',
        text2: 'Allowed range: 1–120 minutes',
      });
      return;
    }

    if (value > 15) {
      setPendingManualCoolingDur(value);
      setConfirmManualCoolingDurModal(true);
      return;
    }

    set(ref(realtimeDB, 'ManualCoolingDuration'), value);
    setManualCoolingDurationModal(false);
  };
  const handleManualCoolingDurationInput = (text) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setInputManualCoolingDuration(cleaned);
  };

  const saveAutoCoolingTemp = () => {
    const value = parseFloat(inputAutoCoolingTemp);

    if (isNaN(value) || value < 16 || value > 80) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Temperature',
        text2: 'Allowed range: 16-80 °C',
      });
      return;
    }
    
    if (value < 35) {
      setPendingAutoCoolingTemp(value);
      setConfirmAutoCoolingTempModal(true);
      return;
    }

    set(ref(realtimeDB, 'AutomaticCoolingActivationTemp'), value);
    setAutoCoolingTempModal(false);
  };
  const handleAutoCoolingTempInput = (text) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      setInputAutoCoolingTemp(parts[0] + '.' + parts[1]);
    } else {
      setInputAutoCoolingTemp(cleaned);
    }
  };

  const saveAutoCleaningTime = () => {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

    if (!timeRegex.test(inputAutoCleaningTime)) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Time',
        text2: 'Format must be HH:mm (00–23)',
      });
      return;
    }

    const hour = parseInt(inputAutoCleaningTime.split(':')[0], 10);

    if (hour >= 6 && hour <= 17) {
      setPendingAutoCleaningTime(inputAutoCleaningTime);
      setConfirmAutoCleaningTimeModal(true);
    } else {
      set(ref(realtimeDB, 'AutomaticCleaningActivationTime'), inputAutoCleaningTime);
      setAutoCleaningTimeModal(false);
    }
  };

  const handleTimeInput = (text) => {
    const cleaned = text.replace(/\D/g, '');

    if (cleaned.length <= 2) {
      setInputAutoCleaningTime(cleaned);
    } else {
      setInputAutoCleaningTime(`${cleaned.slice(0, 2)}:${cleaned.slice(2, 4)}`);
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
          
      <View style={[styles.innerContainer]}>
        <Text style={styles.screenTitle}>System</Text>
        <Text style={styles.screenTitleBottom}>Settings</Text>
      </View>

      <View style={styles.doubleCardContainer}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.valueContainerMode} onPress={openAutoCleanIntervalModal}>
            <Text numberOfLines={1} adjustsFontSizeToFit style={styles.controlCardValue}>
              {autoCleaningInterval ?? '—'}
            </Text> 
          </TouchableOpacity>
          <View>
            <Text style={styles.cardTitleText}>
              Automatic Cleaning
            </Text>
            <Text style={styles.cardTitleTextBottom}>
              Interval (Days)
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <TouchableOpacity style={styles.valueContainerMode} onPress={openManualCoolingDurationModal}>
            <Text numberOfLines={1} adjustsFontSizeToFit style={styles.controlCardValue}>
              {manualCoolingDuration ?? '—'}
            </Text> 
          </TouchableOpacity>
          <View>
            <Text style={styles.cardTitleText}>
              Manual Cooling
            </Text>
            <Text style={styles.cardTitleTextBottom}>
              Duration (Mins.)
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.doubleCardContainer}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.valueContainerMode} onPress={openAutoCoolingTempModal}>
            <Text numberOfLines={1} adjustsFontSizeToFit style={styles.controlCardValue}>
              {autoCoolingTemp !== null ? (
                <>
                  {parseFloat(autoCoolingTemp).toFixed(1)}
                  <Text style={{ color: '#ffffff', fontFamily: 'Poppins-Regular', fontSize: 20 }}> °C</Text>
                </>
              ) : (
                '...'
              )}
            </Text> 
          </TouchableOpacity>
          <View>
            <Text style={styles.cardTitleText}>
              Automatic Cooling
            </Text>
            <Text style={styles.cardTitleTextBottom}>
              Activation Temperature
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <TouchableOpacity style={styles.valueContainerMode} onPress={openAutoCleaningTimeModal}>
            <Text numberOfLines={1} adjustsFontSizeToFit style={styles.controlCardValue}>
              {autoCleaningTime ?? '—'}
            </Text> 
          </TouchableOpacity>
          <View>
            <Text style={styles.cardTitleText}>
              Automatic Cleaning
            </Text>
            <Text style={styles.cardTitleTextBottom}>
              Activation Time
            </Text>
          </View>
        </View>
      </View>


      {/* EDIT MODAL */}
      <Modal visible={autoCleanIntervalModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Automatic Cleaning Interval (Days)</Text>
            <View style={styles.inputMainContainer}>
              {/* <Text style={styles.label}>Email</Text> */}
              <View style={[styles.inputContainer, isFocusedACI && styles.inputContainerFocused]}>
                <TextInput
                  placeholder="Enter Auto Cleaning Interval Value"
                  value={inputAutoCleanInterval}
                  onChangeText={handleAutoCleaningIntervalInput}
                  style={styles.input}
                  keyboardType="numeric"
                  onFocus={() => setIsFocusedACI(true)}
                  onBlur={() => setIsFocusedACI(false)}
                />
              </View>
            </View>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity onPress={saveAutoCleaningInterval} style={[styles.modalButton, styles.modalProceedButton]}>
                <Text style={styles.modalButtonText}>Yes</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setAutoCleanIntervalModal(false)} style={[styles.modalButton, styles.modalCancelButton]}>
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      <Modal visible={manualCoolingDurationModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Manual Cooling Duration (Mins.)</Text>
            <View style={styles.inputMainContainer}>
              {/* <Text style={styles.label}>Email</Text> */}
              <View style={[styles.inputContainer, isFocusedMCD && styles.inputContainerFocused]}>
                <TextInput
                  placeholder="Enter Manual Cooling Duration Value"
                  value={inputManualCoolingDuration}
                  onChangeText={handleManualCoolingDurationInput}
                  style={styles.input}
                  keyboardType="numeric"
                  onFocus={() => setIsFocusedMCD(true)}
                  onBlur={() => setIsFocusedMCD(false)}
                />
              </View>
            </View>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity onPress={saveManualCoolingDuration} style={[styles.modalButton, styles.modalProceedButton]}>
                <Text style={styles.modalButtonText}>Yes</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setManualCoolingDurationModal(false)} style={[styles.modalButton, styles.modalCancelButton]}>
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      <Modal visible={autoCoolingTempModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Automatic Cooling Activation Temperature</Text>
            <View style={styles.inputMainContainer}>
              {/* <Text style={styles.label}>Email</Text> */}
              <View style={[styles.inputContainer, isFocusedACAT && styles.inputContainerFocused]}>
                <TextInput
                  placeholder="Enter Automatic Cooling Activation Temperature Value"
                  value={inputAutoCoolingTemp}
                  onChangeText={handleAutoCoolingTempInput}
                  style={styles.input}
                  keyboardType="numeric"
                  onFocus={() => setIsFocusedACAT(true)}
                  onBlur={() => setIsFocusedACAT(false)}
                />
              </View>
            </View>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity onPress={saveAutoCoolingTemp} style={[styles.modalButton, styles.modalProceedButton]}>
                <Text style={styles.modalButtonText}>Yes</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setAutoCoolingTempModal(false)} style={[styles.modalButton, styles.modalCancelButton]}>
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      <Modal visible={autoCleaningTimeModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Automatic Cleaning Activation Time</Text>
            <View style={styles.inputMainContainer}>
              {/* <Text style={styles.label}>Email</Text> */}
              <View style={[styles.inputContainer, isFocusedACLAT && styles.inputContainerFocused]}>
                <TextInput
                  placeholder="HH:mm (e.g. 16:00)"
                  value={inputAutoCleaningTime}
                  onChangeText={handleTimeInput}
                  style={styles.input}
                  keyboardType="numeric"
                  maxLength={5}
                  onFocus={() => setIsFocusedACLAT(true)}
                  onBlur={() => setIsFocusedACLAT(false)}
                />
              </View>
            </View>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity onPress={saveAutoCleaningTime} style={[styles.modalButton, styles.modalProceedButton]}>
                <Text style={styles.modalButtonText}>Yes</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setAutoCleaningTimeModal(false)} style={[styles.modalButton, styles.modalCancelButton]}>
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      

      {/* CONFIRMATION MODAL */}
      <Modal visible={confirmAutoCleaningIntModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Ionicons
              name="warning"
              size={30}
              color="orange"
              style={{ alignSelf: 'center', marginBottom: 10 }}
            />

            <Text style={styles.modalTypeTitle}>Warning</Text>

            <Text style={styles.modalText}>
              Cleaning
              intervals longer
              than <Text style={styles.boldText}>14 days</Text> may
              cause significant
              dust accumulation
              and reduced panel
              efficiency.
            </Text>
            <Text style={styles.modalText}>
              Recommended
              maximum interval: <Text style={styles.boldText}>7–
              14 days</Text>
            </Text>

            <Text style={[styles.modalText, styles.boldText]}>
              Do you want to proceed anyway?
            </Text>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalProceedButton]}
                onPress={() => {
                  set(
                    ref(realtimeDB, 'AutomaticCleaningInterval'),
                    pendingAutoCleaningInt
                  );
                  setConfirmAutoCleaningIntModal(false);
                  setAutoCleanIntervalModal(false);
                }}
              >
                <Text style={styles.modalButtonText}>Yes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setConfirmAutoCleaningIntModal(false)}
              >
                <Text style={styles.modalButtonTextCancel}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      <Modal visible={confirmManualCoolingDurModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Ionicons
              name="warning"
              size={30}
              color="orange"
              style={{ alignSelf: 'center', marginBottom: 10 }}
            />

            <Text style={styles.modalTypeTitle}>Warning</Text>

            <Text style={styles.modalText}>
              Cooling
              durations longer
              than <Text style={styles.boldText}>15 minutes </Text>
               may result in
              diminishing
              efficiency gains
              and increased
              auxiliary power
              consumption.
            </Text>

            <Text style={[styles.modalText, styles.boldText]}>
              Do you want to proceed anyway?
            </Text>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalProceedButton]}
                onPress={() => {
                  set(
                    ref(realtimeDB, 'ManualCoolingDuration'),
                    pendingManualCoolingDur
                  );
                  setConfirmManualCoolingDurModal(false);
                  setManualCoolingDurationModal(false);
                }}
              >
                <Text style={styles.modalButtonText}>Yes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setConfirmManualCoolingDurModal(false)}
              >
                <Text style={styles.modalButtonTextCancel}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={confirmAutoCoolingTempModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Ionicons
              name="warning"
              size={30}
              color="orange"
              style={{ alignSelf: 'center', marginBottom: 10 }}
            />

            <Text style={styles.modalTypeTitle}>Warning</Text>

            <Text style={styles.modalText}>
              Setting activation temperature below{' '}
              <Text style={styles.boldText}>35 °C</Text> may cause unnecessary energy
              consumption due to frequent and unnecessary cooling operation.
            </Text>

            <Text style={[styles.modalText, styles.boldText]}>
              Do you want to proceed anyway?
            </Text>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalProceedButton]}
                onPress={() => {
                  set(
                    ref(realtimeDB, 'AutomaticCoolingActivationTemp'),
                    pendingAutoCoolingTemp
                  );
                  setConfirmAutoCoolingTempModal(false);
                  setAutoCoolingTempModal(false);
                }}
              >
                <Text style={styles.modalButtonText}>Yes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setConfirmAutoCoolingTempModal(false)}
              >
                <Text style={styles.modalButtonTextCancel}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      <Modal visible={confirmAutoCleaningTimeModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Ionicons
              name="warning"
              size={30}
              color="orange"
              style={{ alignSelf: 'center', marginBottom: 10 }}
            />

            <Text style={styles.modalTypeTitle}>Warning</Text>

            <Text style={styles.modalText}>
              Automatic
              cleaning during
              periods of high
              sunlight may
              negatively affect
              energy generation
              and cleaning
              effectiveness. 
            </Text>

            <Text style={[styles.modalText, styles.boldText]}>
              Do you want to proceed anyway?
            </Text>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalProceedButton]}
                onPress={() => {
                  set(
                    ref(realtimeDB, 'AutomaticCleaningActivationTime'),
                    pendingAutoCleaningTime
                  );
                  setConfirmAutoCleaningTimeModal(false);
                  setAutoCleaningTimeModal(false);
                }}
              >
                <Text style={styles.modalButtonText}>Yes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setConfirmAutoCleaningTimeModal(false)}
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

export default SettingScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    paddingVertical: 5,
    paddingHorizontal: 10,
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
    marginTop: -18,
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
  
  // Control
  valueContainerMode:{
    width: '100%',
    backgroundColor: '#1800ac',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 5,
    borderRadius: 20
  },
  contolCardTitle:{
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    fontSize: 12,
    color: '#fff'
  },
  controlCardValue:{
    fontFamily: 'Poppins-Black',
    textAlign: 'center',
    fontSize: 32,
    color: '#fff'
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
    marginHorizontal: 'auto',
    marginTop: 40
    // justifyContent: 'space-between',
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

  // INPUT
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    marginBottom: 5,
    color: '#255ba0',
  },
  inputMainContainer: {
    width: '100%',
    marginVertical: 10,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter-Regular',
  },
  inputContainer: {
    width: '100%',
    height: 64,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#a1a2a8',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainerFocused: {
    borderColor: '#3B82F6',
  },
})