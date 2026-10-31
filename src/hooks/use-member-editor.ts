import { useAuth } from '@/contexts/auth-context';
import { pickMemberPhoto } from '@/lib/pick-member-photo';
import { useState } from 'react';
import { deleteMemberPhoto } from '@/lib/member-photos';
import { supabase } from '@/lib/supabase';
import type { Member } from '@/types/member';

export function useMemberEditor(refresh: () => Promise<void>) {
  const { refreshProfile } = useAuth();
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editDraft, setEditDraft] = useState<Member | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  // Path of a photo uploaded during this edit session but not yet saved to the
  // member row — used to clean up the orphaned object if the user cancels.
  const [uploadedPhotoThisSession, setUploadedPhotoThisSession] = useState<string | null>(null);
  const [photoPreviewUri, setPhotoPreviewUri] = useState<string | null>(null);

  const openEdit = (member: Member) => {
    setEditingMember(member);
    setEditDraft({ ...member });
    setEditError(null);
    setUploadedPhotoThisSession(null);
    setPhotoPreviewUri(null);
  };

  const resetEditState = () => {
    setEditingMember(null);
    setEditDraft(null);
    setEditError(null);
    setUploadedPhotoThisSession(null);
    setPhotoPreviewUri(null);
  };

  const closeEdit = () => {
    if (photoUploading || editSubmitting) return;
    if (uploadedPhotoThisSession) {
      void deleteMemberPhoto(uploadedPhotoThisSession);
    }
    resetEditState();
  };

  const pickAndUploadPhoto = async () => {
    if (!editDraft || photoUploading || editSubmitting) {
      return;
    }

    setPhotoUploading(true);
    try {
      const photo = await pickMemberPhoto(editDraft.id);
      if (!photo) return;
      const { path, previewUri } = photo;
      if (uploadedPhotoThisSession) {
        deleteMemberPhoto(uploadedPhotoThisSession);
      }
      setUploadedPhotoThisSession(path);
      setPhotoPreviewUri(previewUri);
      setEditDraft((current) => current ? { ...current, photoPath: path } : current);
    } catch (uploadError) {
      setEditError(uploadError instanceof Error ? uploadError.message : '사진 업로드에 실패했습니다.');
    } finally {
      setPhotoUploading(false);
    }
  };

  const saveEdit = async () => {
    if (!editDraft || photoUploading || editSubmitting) {
      return;
    }

    setEditSubmitting(true);
    try {
      const { error: saveError } = await supabase
        .from('members')
        .update({
          name_ko: editDraft.nameKo,
          name_en: editDraft.nameEn || null,
          dob: editDraft.dob,
          gender: editDraft.gender,
          phone: editDraft.phone || null,
          address: editDraft.address || null,
          cell_leader_id: editDraft.cellLeaderId,
          permission: editDraft.permission,
          position: editDraft.position,
          photo_path: editDraft.photoPath,
        })
        .eq('id', editDraft.id);
      if (saveError) throw saveError;

      if (editingMember?.photoPath && editingMember.photoPath !== editDraft.photoPath) {
        deleteMemberPhoto(editingMember.photoPath);
      }
      resetEditState();
      await Promise.all([refresh(), refreshProfile()]);
    } catch (error) {
      setEditError(error instanceof Error ? error.message : '성도 정보 저장에 실패했습니다.');
    } finally {
      setEditSubmitting(false);
    }
  };

  return { editingMember, editDraft, setEditDraft, editError, editSubmitting, photoUploading, photoPreviewUri, openEdit, closeEdit, pickAndUploadPhoto, saveEdit };
}
