/**
 * @file Menu.tsx
 * @description Reusable dropdown menu component anchored to a trigger (icon/button), with click-outside-to-close behavior. Tailwind styled.
 */
import React, { useRef, useState } from 'react';
import { View, Modal, TouchableOpacity, Pressable, StyleSheet, Dimensions } from 'react-native';

/**
 * Props for the Menu component.
 */
export interface MenuProps {
  trigger: React.ReactNode; // The icon/button that opens the menu
  children: React.ReactNode; // Menu items
  menuWidth?: number; // Optional: width of the dropdown
  menuStyle?: object; // Optional: extra style for the menu
}

/**
 * Dropdown menu anchored to a trigger, closes when clicking outside.
 */
export function Menu({ trigger, children, menuWidth = 180, menuStyle = {} }: MenuProps) {
  const [visible, setVisible] = useState(false);
  const triggerRef = useRef<any>(null);
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);

  // Open menu and measure trigger position
  function openMenu() {
    if (triggerRef.current) {
      triggerRef.current.measure(
        (fx: number, fy: number, width: number, height: number, px: number, py: number) => {
          setAnchor({ x: px, y: py + height });
          setVisible(true);
        },
      );
    } else {
      setVisible(true);
    }
  }

  // Close menu
  function closeMenu() {
    setVisible(false);
  }

  // Render menu dropdown
  return (
    <>
      <TouchableOpacity ref={triggerRef} onPress={openMenu} activeOpacity={0.7}>
        {trigger}
      </TouchableOpacity>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={closeMenu}>
        {/* Overlay to catch outside clicks */}
        <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu}>
          {/* Empty view to catch the press */}
        </Pressable>
        {/* Dropdown menu */}
        <View
          style={[
            {
              position: 'absolute',
              top: anchor ? anchor.y : Dimensions.get('window').height / 4,
              left: anchor ? anchor.x - menuWidth + 32 : 32,
              width: menuWidth,
              backgroundColor: 'white',
              borderRadius: 16,
              shadowColor: '#000',
              shadowOpacity: 0.08,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 8,
              paddingVertical: 8,
              zIndex: 100,
            },
            menuStyle,
          ]}
        >
          {children}
        </View>
      </Modal>
    </>
  );
}

export default Menu;
