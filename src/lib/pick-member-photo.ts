import * as ImagePicker from 'expo-image-picker';

import { uploadMemberPhoto } from '@/lib/member-photos';

/** Shared picker/upload flow for profile settings and member editing. */
export async function pickMemberPhoto(memberId: string) {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error('사진 보관함 접근 권한이 필요합니다.');

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7,
  });
  if (result.canceled || result.assets.length === 0) return null;

  const asset = result.assets[0];
  const path = await uploadMemberPhoto(memberId, asset.uri, asset.mimeType ?? 'image/jpeg');
  return { path, previewUri: asset.uri };
}
