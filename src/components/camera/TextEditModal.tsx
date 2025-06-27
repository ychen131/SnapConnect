/**
 * @file TextEditModal.tsx
 * @description Modal for editing text overlay properties
 */
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native';
import type { TextOverlay } from '../../utils/imageFilters';
import { AVAILABLE_FONTS, AVAILABLE_COLORS, AVAILABLE_FONT_SIZES } from '../../utils/imageFilters';

interface TextEditModalProps {
  visible: boolean;
  overlay: TextOverlay | null;
  onSave: (overlay: TextOverlay) => void;
  onCancel: () => void;
  onDelete: () => void;
}

/**
 * Modal for editing text overlay properties
 */
export default function TextEditModal({
  visible,
  overlay,
  onSave,
  onCancel,
  onDelete,
}: TextEditModalProps) {
  const [text, setText] = useState('');
  const [fontFamily, setFontFamily] = useState('System');
  const [color, setColor] = useState('#FFFFFF');
  const [fontSize, setFontSize] = useState(24);

  // Update form when overlay changes
  useEffect(() => {
    if (overlay) {
      setText(overlay.text);
      setFontFamily(overlay.fontFamily);
      setColor(overlay.color);
      setFontSize(overlay.fontSize);
    }
  }, [overlay]);

  const handleSave = () => {
    if (!overlay || !text.trim()) {
      Alert.alert('Error', 'Please enter some text');
      return;
    }

    const updatedOverlay: TextOverlay = {
      ...overlay,
      text: text.trim(),
      fontFamily,
      color,
      fontSize,
    };

    onSave(updatedOverlay);
  };

  const handleDelete = () => {
    Alert.alert('Delete Text', 'Are you sure you want to delete this text overlay?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: onDelete,
      },
    ]);
  };

  if (!overlay) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-gray-200 px-4 py-3">
          <TouchableOpacity onPress={onCancel}>
            <Text className="font-semibold text-blue-500">Cancel</Text>
          </TouchableOpacity>
          <Text className="text-lg font-semibold">Edit Text</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text className="font-semibold text-blue-500">Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-4 py-6">
          {/* Text Input */}
          <View className="mb-6">
            <Text className="mb-2 text-sm font-medium text-gray-700">Text</Text>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Enter your text..."
              className="rounded-lg border border-gray-300 px-3 py-2 text-base"
              multiline
              maxLength={100}
            />
            <Text className="mt-1 text-xs text-gray-500">{text.length}/100</Text>
          </View>

          {/* Font Selection */}
          <View className="mb-6">
            <Text className="mb-2 text-sm font-medium text-gray-700">Font</Text>
            <View className="flex-row flex-wrap gap-2">
              {AVAILABLE_FONTS.map((font) => (
                <TouchableOpacity
                  key={font.name}
                  onPress={() => setFontFamily(font.name)}
                  className={`rounded-lg border px-3 py-2 ${
                    fontFamily === font.name
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300 bg-gray-100'
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      fontFamily === font.name ? 'text-white' : 'text-gray-700'
                    }`}
                    style={{ fontFamily: font.name }}
                  >
                    {font.displayName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Color Selection */}
          <View className="mb-6">
            <Text className="mb-2 text-sm font-medium text-gray-700">Color</Text>
            <View className="flex-row flex-wrap gap-2">
              {AVAILABLE_COLORS.map((colorOption) => (
                <TouchableOpacity
                  key={colorOption.value}
                  onPress={() => setColor(colorOption.value)}
                  className={`h-12 w-12 rounded-full border-2 ${
                    color === colorOption.value ? 'border-blue-500' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: colorOption.value }}
                >
                  {color === colorOption.value && (
                    <View className="flex-1 items-center justify-center">
                      <Text className="text-lg text-white">✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Font Size Selection */}
          <View className="mb-6">
            <Text className="mb-2 text-sm font-medium text-gray-700">Size</Text>
            <View className="flex-row flex-wrap gap-2">
              {AVAILABLE_FONT_SIZES.map((size) => (
                <TouchableOpacity
                  key={size.value}
                  onPress={() => setFontSize(size.value)}
                  className={`rounded-lg border px-3 py-2 ${
                    fontSize === size.value
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300 bg-gray-100'
                  }`}
                >
                  <Text
                    className={`${fontSize === size.value ? 'text-white' : 'text-gray-700'}`}
                    style={{ fontSize: size.value * 0.6 }}
                  >
                    {size.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Preview */}
          <View className="mb-6">
            <Text className="mb-2 text-sm font-medium text-gray-700">Preview</Text>
            <View className="items-center rounded-lg bg-gray-100 p-4">
              <Text
                style={{
                  fontSize,
                  color,
                  fontFamily,
                  textShadowColor: 'rgba(0, 0, 0, 0.8)',
                  textShadowOffset: { width: 1, height: 1 },
                  textShadowRadius: 2,
                  fontWeight: 'bold',
                }}
              >
                {text || 'Preview Text'}
              </Text>
            </View>
          </View>

          {/* Delete Button */}
          <TouchableOpacity
            onPress={handleDelete}
            className="items-center rounded-lg bg-red-500 py-3"
          >
            <Text className="font-semibold text-white">Delete Text</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}
