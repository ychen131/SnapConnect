/**
 * @file TimerSelector.tsx
 * @description Modal scrollable picker for selecting a timer value (1-10 seconds and 'no timer') for the camera screen.
 */
import React from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';

/**
 * Props for TimerSelector component
 * @param visible - Whether the modal is visible
 * @param selectedValue - The currently selected timer value (number in seconds, or 0 for no timer)
 * @param onSelect - Callback when a timer value is selected
 * @param onClose - Callback to close the modal
 */
interface TimerSelectorProps {
  visible: boolean;
  selectedValue: number;
  onSelect: (value: number) => void;
  onClose: () => void;
}

const TIMER_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/**
 * Modal scrollable picker for timer selection
 */
export default function TimerSelector({
  visible,
  selectedValue,
  onSelect,
  onClose,
}: TimerSelectorProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Select Timer</Text>
          <FlatList
            data={TIMER_OPTIONS}
            keyExtractor={(item) => item.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.option, selectedValue === item && styles.selectedOption]}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Text
                  style={[styles.optionText, selectedValue === item && styles.selectedOptionText]}
                >
                  {item === 0 ? 'No Timer' : `${item}s`}
                </Text>
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
          />
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: 280,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginVertical: 4,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    width: 180,
  },
  selectedOption: {
    backgroundColor: '#FFD600',
  },
  optionText: {
    fontSize: 16,
    color: '#222',
  },
  selectedOptionText: {
    color: '#222',
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#222',
    fontWeight: '500',
  },
});
