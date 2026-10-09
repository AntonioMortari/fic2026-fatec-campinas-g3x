function checkDigit(digits: number[], weightStart: number): number {
  const sum = digits.reduce((total, digit, index) => total + digit * (weightStart - index), 0);
  const remainder = (sum * 10) % 11;
  return remainder === 10 ? 0 : remainder;
}

export function isValidCpf(value: string): boolean {
  if (!/^\d{11}$/.test(value)) return false;
  // 111.111.111-11 and its kin pass the arithmetic below and are not real documents.
  if (/^(\d)\1{10}$/.test(value)) return false;

  const digits = [...value].map(Number);
  return checkDigit(digits.slice(0, 9), 10) === digits[9] && checkDigit(digits.slice(0, 10), 11) === digits[10];
}
