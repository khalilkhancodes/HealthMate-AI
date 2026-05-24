import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { FlatList, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useHealthStore } from '../store/useHealthStore';
import { useTheme } from '../theme/theme';

const AVATAR_ASSETS = [
  require('../../assets/Avatars/avatar1.png'),
  require('../../assets/Avatars/avatar2.png'),
  require('../../assets/Avatars/avatar3.png'),
  require('../../assets/Avatars/avatar4.png'),
  require('../../assets/Avatars/avatar5.png'),
  require('../../assets/Avatars/avatar6.png'),
  require('../../assets/Avatars/avatar7.png'),
  require('../../assets/Avatars/avatar8.png'),
  require('../../assets/Avatars/avatar9.png'),
];

export default function AvatarSelectionModal({ visible, onClose, currentAvatar }) {
  const { COLORS, FONTS } = useTheme();
  const setUserAvatar = useHealthStore((s) => s.setUserAvatar);

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUserAvatar({ uri: result.assets[0].uri });
        onClose?.();
      }
    } catch (err) {
      console.warn('ImagePicker error', err);
    }
  };

  const renderAvatarItem = ({ item }) => (
    <TouchableOpacity
      style={styles.avatarItem}
      onPress={() => {
        setUserAvatar(item);
        onClose?.();
      }}
      activeOpacity={0.85}
    >
      <Image source={item} style={styles.avatarThumb} />
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.overlayTouchable} activeOpacity={1} onPress={onClose} />

        <View style={[styles.sheet, { backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24 }]}>
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, FONTS.sectionHeading, { color: COLORS.textPrimary }]}>Choose your avatar</Text>
            <Text style={[styles.sheetSubtitle, FONTS.bodyText, { color: COLORS.textSecondary }]}>Tap a default avatar or upload from gallery</Text>
          </View>

          <FlatList
            data={AVATAR_ASSETS}
            keyExtractor={(item, idx) => `avatar-${idx}`}
            renderItem={renderAvatarItem}
            numColumns={3}
            contentContainerStyle={styles.avatarsGrid}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
          />

          <TouchableOpacity style={[styles.uploadBtn, { backgroundColor: COLORS.primary }]} activeOpacity={0.9} onPress={pickFromGallery}>
            <Ionicons name="image-outline" size={18} color={COLORS.onPrimary} style={{ marginRight: 8 }} />
            <Text style={[styles.uploadBtnText, { color: COLORS.onPrimary }]}>Upload from Gallery</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 19, 38, 0.85)',
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    flex: 1,
  },
  sheet: {
    paddingTop: 16,
    paddingHorizontal: 18,
    paddingBottom: 28,
  },
  sheetHeader: {
    marginBottom: 12,
    alignItems: 'center',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  sheetSubtitle: {
    fontSize: 13,
    marginTop: 6,
  },
  avatarsGrid: {
    paddingVertical: 8,
  },
  avatarItem: {
    width: 86,
    height: 86,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  avatarThumb: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadBtn: {
    marginTop: 12,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  uploadBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
