type EnglishNameParts = {
  firstNameEn: string;
  lastNameEn: string;
};

/** `First Last` for display; empty string when both parts are blank. */
export function formatMemberNameEn(member: EnglishNameParts) {
  return [member.firstNameEn.trim(), member.lastNameEn.trim()].filter(Boolean).join(' ');
}
