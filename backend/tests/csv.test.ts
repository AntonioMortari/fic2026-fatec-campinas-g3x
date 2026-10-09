import { csvCell, toCsv } from '../src/utils/csv';

describe('csvCell', () => {
  it('writes plain text as it is, and null or undefined as empty', () => {
    expect(csvCell('Ana Souza')).toBe('Ana Souza');
    expect(csvCell(null)).toBe('');
    expect(csvCell(undefined)).toBe('');
    expect(csvCell(12)).toBe('12');
    expect(csvCell(false)).toBe('false');
  });

  it.each(['=1+1', '+5511999999999', '-2+3', '@SUM(A1)', '\tcmd', '\rcmd'])('neutralizes %j, which a spreadsheet would run as a formula', (value) => {
    expect(csvCell(value).replace(/^"/, '')).toMatch(/^'/);
  });

  it('is not fooled by quotes around the formula', () => {
    expect(csvCell('=HYPERLINK("http://mau.example","clique")')).toBe(`"'=HYPERLINK(""http://mau.example"",""clique"")"`);
  });

  it('does not touch a formula character that is not the first one', () => {
    expect(csvCell('Ana = Souza')).toBe('Ana = Souza');
    expect(csvCell('a@b.com')).toBe('a@b.com');
  });

  it('quotes what contains the delimiter, a quote or a line break, doubling the quotes', () => {
    expect(csvCell('Souza; Ana')).toBe('"Souza; Ana"');
    expect(csvCell('Ana "Aninha" Souza')).toBe('"Ana ""Aninha"" Souza"');
    expect(csvCell('linha 1\nlinha 2')).toBe('"linha 1\nlinha 2"');
  });

  it('does not quote a comma, because the delimiter is the semicolon', () => {
    expect(csvCell('Souza, Ana')).toBe('Souza, Ana');
  });
});

describe('toCsv', () => {
  it('starts with a BOM, separates cells with semicolons and rows with CRLF', () => {
    expect(toCsv([['a', 'b'], ['c', 'd']])).toBe('﻿a;b\r\nc;d\r\n');
  });

  it('keeps accents and emoji', () => {
    expect(toCsv([['Conceição 🌍']])).toContain('Conceição 🌍');
  });
});
