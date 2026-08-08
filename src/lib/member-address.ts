/** Canadian mailing-style address parts stored on `members`. */
export type MemberAddressParts = {
  addressStreet: string;
  addressUnit: string;
  addressCity: string;
  addressProvince: string;
  addressPostalCode: string;
};

export const EMPTY_MEMBER_ADDRESS: MemberAddressParts = {
  addressStreet: '',
  addressUnit: '',
  addressCity: '',
  addressProvince: '',
  addressPostalCode: '',
};

/** Common Canadian province/territory codes for the edit picker. */
export const CA_PROVINCE_OPTIONS = [
  'ON',
  'BC',
  'AB',
  'QC',
  'MB',
  'SK',
  'NS',
  'NB',
  'NL',
  'PE',
  'YT',
  'NT',
  'NU',
] as const;

/** Format postal code as `A1A 1A1` when possible. */
export function formatPostalCode(value: string) {
  const compact = value.replace(/\s+/g, '').toUpperCase();
  if (compact.length <= 3) {
    return compact;
  }
  return `${compact.slice(0, 3)} ${compact.slice(3, 6)}`.trim();
}

/** Letter-digit-letter digit-letter-digit (e.g. M2N 1A1). */
const CANADIAN_POSTAL_CODE = /^[A-Z]\d[A-Z] \d[A-Z]\d$/;

export function isValidCanadianPostalCode(value: string) {
  const formatted = formatPostalCode(value);
  return CANADIAN_POSTAL_CODE.test(formatted);
}

const POSTAL_CODE_ERROR = '잘못 적었습니다. 예: M2N 1A1 (영문·숫자·영문 숫자·영문·숫자)';

/**
 * Inline UI error: only after all 6 characters are entered.
 * Empty / still typing shows nothing.
 */
export function getPostalCodeError(value: string) {
  const compact = value.replace(/\s+/g, '').toUpperCase();
  if (compact.length < 6) {
    return null;
  }
  if (isValidCanadianPostalCode(value)) {
    return null;
  }
  return POSTAL_CODE_ERROR;
}

/** Save-time check: empty OK; any non-empty value must be a full valid code. */
export function getPostalCodeSaveError(value: string) {
  const compact = value.replace(/\s+/g, '').toUpperCase();
  if (!compact) {
    return null;
  }
  if (isValidCanadianPostalCode(value)) {
    return null;
  }
  return POSTAL_CODE_ERROR;
}

function formatCityProvincePostal(parts: MemberAddressParts) {
  const city = parts.addressCity.trim();
  const province = parts.addressProvince.trim();
  const postal = parts.addressPostalCode.trim();
  const provincePostal = [province, postal].filter(Boolean).join(' ');

  if (city && provincePostal) {
    return `${city}, ${provincePostal}`;
  }
  return city || provincePostal;
}

/** Single-line Canadian address for search / compact labels. */
export function formatMemberAddress(parts: MemberAddressParts) {
  const street = parts.addressUnit.trim()
    ? `${parts.addressStreet.trim()}, Unit ${parts.addressUnit.trim()}`
    : parts.addressStreet.trim();
  const cityLine = formatCityProvincePostal(parts);

  return [street, cityLine].filter(Boolean).join(', ') || '';
}

/** Multi-line Canadian address for member cards. */
export function formatMemberAddressLines(parts: MemberAddressParts) {
  const lines: string[] = [];
  if (parts.addressStreet.trim()) {
    lines.push(parts.addressStreet.trim());
  }
  if (parts.addressUnit.trim()) {
    lines.push(`Unit ${parts.addressUnit.trim()}`);
  }
  const cityLine = formatCityProvincePostal(parts);
  if (cityLine) {
    lines.push(cityLine);
  }
  return lines;
}
