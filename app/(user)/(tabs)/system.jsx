import { StyleSheet, Text, View, Image, ScrollView, FlatList, TouchableOpacity, Dimensions, Switch, Modal, TextInput, Animated } from 'react-native'
import { useEffect, useState, useRef } from 'react';
import { ref, onValue, set } from 'firebase/database';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { realtimeDB, firestoreDB } from '../../../firebase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import ToastManager, { Toast } from 'toastify-react-native'

const SystemScreen = () => {
  
  const [coolantValue, setCoolantValue] = useState(null);
  const [cleaningValue, setCleaningValue] = useState(null);
  const [inspectionValue, setInspectionValue] = useState(null);

  const [coolantTimerModalVisible, setCoolantTimerModalVisible] = useState(false);
  const [cleaningPadModalVisible, setCleaningPadModalVisible] = useState(false);
  const [inspectionTimerModalVisible, setInspectionTimerModalVisible] = useState(false);

  useEffect(() => {
    const coolantRef = ref(realtimeDB, 'Maintenance/CoolantReplacement');
    const cleaningRef = ref(realtimeDB, 'Maintenance/CleaningPadReplacement');
    const inspectionRef = ref(realtimeDB, 'Maintenance/PumpAndFanInspection');

    const unsubCoolant = onValue(coolantRef, snapshot => {
      if (snapshot.exists()) setCoolantValue(snapshot.val());
    });

    const unsubCleaning = onValue(cleaningRef, snapshot => {
      if (snapshot.exists()) setCleaningValue(snapshot.val());
    });

    const unsubInspection = onValue(inspectionRef, snapshot => {
      if (snapshot.exists()) setInspectionValue(snapshot.val());
    });

    return () => {
      unsubCoolant();
      unsubCleaning();
      unsubInspection();
    };
  }, []);

  const handleCoolantPress = () => {
    setCoolantTimerModalVisible(true);
  };

  const handleCleaningPress = () => {
    setCleaningPadModalVisible(true);
  };

  const handleInspectionPress = () => {
    setInspectionTimerModalVisible(true);
  };

  const resetCoolantTimer = async () => {
    const coolantRef = ref(realtimeDB, 'Maintenance/CoolantReplacement');
    await set(coolantRef, 180);
    Toast.success('Coolant timer reset to 180 days');
  };

  const resetCleaningTimer = async () => {
    const cleaningRef = ref(realtimeDB, 'Maintenance/CleaningPadReplacement');
    await set(cleaningRef, 60);
    Toast.success('Cleaning pad timer reset to 60 days');
  };

  const resetInspectionTimer = async () => {
    const inspectionRef = ref(realtimeDB, 'Maintenance/PumpAndFanInspection');
    await set(inspectionRef, 365);
    Toast.success('Inspection timer reset to 365 days');
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
        <Text style={styles.screenTitleBottom}>Maintenance</Text>
      </View>

      <View style={styles.singleCardContainer}>
        <View style={styles.card}>
          <View 
            style={[styles.valueContainer]} 
          >
            <Text style={styles.valueTitleText}>
              Coolant Replacement:
            </Text>
            <Text style={styles.valueText}>
              {coolantValue} Days Remaining
            </Text>

            <Text style={styles.valueTitleText}>
              Cleaning Pad Replacement:
            </Text>
            <Text style={styles.valueText}>
              {cleaningValue} Days Remaining
            </Text>

            <Text style={styles.valueTitleText}>
              Pump and Fan Inspection:
            </Text>
            <Text style={styles.valueText}>
              {inspectionValue} Days
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.singleCardContainer}>
        <View style={styles.card}>
          <TouchableOpacity 
            onPress={handleCoolantPress}
            style={[styles.valueContainer, { backgroundColor: '#00bf62'}]} 
          >
            <Text style={styles.valueBtnText}>
              Reset Coolant Timer
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.singleCardContainer}>
        <View style={styles.card}>
          <TouchableOpacity 
            onPress={handleCleaningPress}
            style={[styles.valueContainer, { backgroundColor: '#00bf62'}]} 
          >
            <Text style={styles.valueBtnText}>
              Reset Cleaning Pad Timer
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.singleCardContainer}>
        <View style={styles.card}>
          <TouchableOpacity 
            onPress={handleInspectionPress}
            style={[styles.valueContainer, { backgroundColor: '#00bf62'}]} 
          >
            <Text style={styles.valueBtnText}>
              Reset Inspection Timer
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Coolant Modal Warning */}
      <Modal
        visible={coolantTimerModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCoolantTimerModalVisible(false)}
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
              Are you sure you
              want to reset this
              maintenance
              counter? This
              action cannot be
              undone.
            </Text>
          
            <Text style={[styles.modalText, styles.boldText]}>
              Do you want to proceed anyway?
            </Text>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                onPress={async () => {
                  await resetCoolantTimer();
                  setCoolantTimerModalVisible(false);
                }}
                style={[styles.modalButton, styles.modalProceedButton]}
              >
                <Text style={styles.modalButtonText}>Yes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setCoolantTimerModalVisible(false)}
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
        visible={cleaningPadModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCleaningPadModalVisible(false)}
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
              Are you sure you
              want to reset this
              maintenance
              counter? This
              action cannot be
              undone.
            </Text>
          
            <Text style={[styles.modalText, styles.boldText]}>
              Do you want to proceed anyway?
            </Text>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                onPress={async () => {
                  await resetCleaningTimer();
                  setCleaningPadModalVisible(false);
                }}
                style={[styles.modalButton, styles.modalProceedButton]}
              >
                <Text style={styles.modalButtonText}>Yes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setCleaningPadModalVisible(false)}
                style={[styles.modalButton, styles.modalCancelButton]}
              >
                <Text style={styles.modalButtonTextCancel}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Inspection Modal Warning */}
      <Modal
        visible={inspectionTimerModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInspectionTimerModalVisible(false)}
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
              Are you sure you
              want to reset this
              maintenance
              counter? This
              action cannot be
              undone.
            </Text>
          
            <Text style={[styles.modalText, styles.boldText]}>
              Do you want to proceed anyway?
            </Text>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                onPress={async () => {
                  await resetInspectionTimer();
                  setInspectionTimerModalVisible(false);
                }}
                style={[styles.modalButton, styles.modalProceedButton]}
              >
                <Text style={styles.modalButtonText}>Yes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setInspectionTimerModalVisible(false)}
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

export default SystemScreen

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
    marginTop: -18,
    marginBottom: 10
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
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 15,
    borderRadius: 20
  },
  valueTitleText:{
    color: '#ffffff',
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    textAlign: 'left',
  },
  valueText:{
    color: '#00bf62',
    fontSize: 18,
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

  valueBtnText:{
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
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