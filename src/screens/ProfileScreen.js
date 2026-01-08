import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Modal, TouchableOpacity } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { GlassCard, GlassButton } from '../components';

const ProfileScreen = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const userCode = "QUEST-USER-8821-XP";

  const handleBarCodeScanned = ({ data }) => {
    setIsScanning(false);
    setScannedData(data);
    alert(`NPC rekrutiert: ${data}`);
  };

  const startScan = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) return;
    }
    setIsScanning(true);
  };

  return (
    <View style={styles.container}>
      <GlassCard style={styles.profileCard}>
        <Text style={styles.title}>Dein Quest-Code</Text>
        <View style={styles.qrContainer}>
          <QRCode
            value={userCode}
            size={180}
            color="#0f172a"
            backgroundColor="white"
          />
        </View>
        <Text style={styles.userId}>ID: {userCode}</Text>
      </GlassCard>
      
      <GlassButton 
        title="Anderen User scannen" 
        onPress={startScan} 
        style={styles.scanButton}
      />

      {scannedData && (
        <Text style={styles.scannedInfo}>Letzter NPC: {scannedData}</Text>
      )}

      <Modal visible={isScanning} animationType="slide">
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            onBarcodeScanned={scannedData ? undefined : handleBarCodeScanned}
            barcodeSettings={{
              barcodeTypes: ["qr"],
            }}
          >
            <View style={styles.cameraOverlay}>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={() => setIsScanning(false)}
              >
                <Text style={styles.closeText}>Abbrechen</Text>
              </TouchableOpacity>
              <View style={styles.scanFrame} />
            </View>
          </CameraView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 20,
    justifyContent: 'center',
  },
  profileCard: {
    alignItems: 'center',
    padding: 30,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 25,
  },
  qrContainer: {
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  userId: {
    color: '#94a3b8',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  scanButton: {
    marginTop: 40,
  },
  scannedInfo: {
    color: '#38bdf8',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 30,
    padding: 10,
  },
  closeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#38bdf8',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
});

export default ProfileScreen;
