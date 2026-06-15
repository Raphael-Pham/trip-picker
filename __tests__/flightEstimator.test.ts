import { describe, it, expect } from 'vitest';
import { estimateFlightCost, getRegion, isAirportReachable } from '../lib/flightEstimator';

describe('getRegion', () => {
  it('returns correct regions for major hubs', () => {
    expect(getRegion('JFK')).toBe('NA');
    expect(getRegion('LAX')).toBe('NA');
    expect(getRegion('LHR')).toBe('EU');
    expect(getRegion('CDG')).toBe('EU');
    expect(getRegion('NRT')).toBe('AP');
    expect(getRegion('SIN')).toBe('AP');
    expect(getRegion('DXB')).toBe('ME');
    expect(getRegion('JNB')).toBe('AF');
    expect(getRegion('GRU')).toBe('SA');
    expect(getRegion('MBJ')).toBe('CAR');
    expect(getRegion('HNL')).toBe('PAC');
  });

  it('maps previously-missing international airports correctly', () => {
    expect(getRegion('HAN')).toBe('AP');   // Hanoi
    expect(getRegion('SGN')).toBe('AP');   // Ho Chi Minh City
    expect(getRegion('DAD')).toBe('AP');   // Da Nang
    expect(getRegion('MLE')).toBe('AP');   // Maldives
    expect(getRegion('HKT')).toBe('AP');   // Phuket
    expect(getRegion('ZQN')).toBe('AP');   // Queenstown NZ
    expect(getRegion('KIX')).toBe('AP');   // Osaka
    expect(getRegion('ZNZ')).toBe('AF');   // Zanzibar
    expect(getRegion('JRO')).toBe('AF');   // Kilimanjaro
    expect(getRegion('RAK')).toBe('AF');   // Marrakech
    expect(getRegion('AMM')).toBe('ME');   // Amman
    expect(getRegion('AQJ')).toBe('ME');   // Petra/Aqaba
    expect(getRegion('CTG')).toBe('SA');   // Cartagena
    expect(getRegion('AUA')).toBe('CAR');  // Aruba
    expect(getRegion('BGI')).toBe('CAR');  // Barbados
    expect(getRegion('SJU')).toBe('CAR');  // San Juan PR
    expect(getRegion('GDT')).toBe('CAR');  // Turks & Caicos
    expect(getRegion('EDI')).toBe('EU');   // Edinburgh
    expect(getRegion('KEF')).toBe('EU');   // Reykjavik
    expect(getRegion('DBV')).toBe('EU');   // Dubrovnik
    expect(getRegion('VCE')).toBe('EU');   // Venice
    expect(getRegion('OPO')).toBe('EU');   // Porto
    expect(getRegion('JTR')).toBe('EU');   // Santorini
    expect(getRegion('LJU')).toBe('EU');   // Ljubljana
  });

  it('maps US domestic airports to NA', () => {
    expect(getRegion('AUS')).toBe('NA');   // Austin
    expect(getRegion('BNA')).toBe('NA');   // Nashville
    expect(getRegion('MSY')).toBe('NA');   // New Orleans
    expect(getRegion('PDX')).toBe('NA');   // Portland
    expect(getRegion('PIT')).toBe('NA');   // Pittsburgh
    expect(getRegion('AVL')).toBe('NA');   // Asheville
    expect(getRegion('JAC')).toBe('NA');   // Jackson Hole
    expect(getRegion('BZN')).toBe('NA');   // Bozeman/Yellowstone
    expect(getRegion('FCA')).toBe('NA');   // Glacier NP
  });

  it('is case-insensitive', () => {
    expect(getRegion('jfk')).toBe('NA');
    expect(getRegion('Han')).toBe('AP');
  });
});

describe('estimateFlightCost', () => {
  it('NA to NA (domestic) is inexpensive', () => {
    const cost = estimateFlightCost('JFK', ['LAX'], 7);
    expect(cost).toBeGreaterThanOrEqual(200);
    expect(cost).toBeLessThanOrEqual(400);
  });

  it('NA to EU is mid-range', () => {
    const cost = estimateFlightCost('JFK', ['LHR'], 7);
    expect(cost).toBeGreaterThanOrEqual(500);
    expect(cost).toBeLessThanOrEqual(900);
  });

  it('NA to AP (Asia Pacific) is expensive', () => {
    const cost = estimateFlightCost('JFK', ['NRT'], 7);  // Tokyo
    expect(cost).toBeGreaterThanOrEqual(700);
    expect(cost).toBeLessThanOrEqual(1100);
  });

  it('Hanoi from JFK costs significantly more than domestic', () => {
    const hanoiCost = estimateFlightCost('JFK', ['HAN'], 7);
    const domesticCost = estimateFlightCost('JFK', ['LAX'], 7);
    expect(hanoiCost).toBeGreaterThan(domesticCost + 300);
  });

  it('Hanoi from JFK is in a realistic range ($700–$1100)', () => {
    const cost = estimateFlightCost('JFK', ['HAN'], 7);
    expect(cost).toBeGreaterThanOrEqual(700);
    expect(cost).toBeLessThanOrEqual(1100);
  });

  it('picks cheapest airport when multiple options given', () => {
    // NA to EU (LHR) vs NA to NA (JFK) — should pick NA
    const cost = estimateFlightCost('LAX', ['LHR', 'JFK'], 7);
    const naCost = estimateFlightCost('LAX', ['JFK'], 7);
    expect(cost).toBe(naCost);
  });

  it('applies long-trip discount for 7+ day trips', () => {
    const longTrip = estimateFlightCost('JFK', ['LHR'], 10);
    const shortTrip = estimateFlightCost('JFK', ['LHR'], 3);
    expect(longTrip).toBeLessThan(shortTrip);
  });

  it('applies short-trip surcharge for 3-day trips', () => {
    const shortTrip = estimateFlightCost('JFK', ['LHR'], 3);
    const medTrip  = estimateFlightCost('JFK', ['LHR'], 5);
    expect(shortTrip).toBeGreaterThan(medTrip);
  });

  it('returns a positive number for unknown airport codes', () => {
    const cost = estimateFlightCost('JFK', ['XYZ'], 7);
    expect(cost).toBeGreaterThan(0);
  });
});

describe('isAirportReachable', () => {
  it('transatlantic flight is reachable on $5000 budget', () => {
    expect(isAirportReachable('JFK', ['LHR'], 5000)).toBe(true);
  });

  it('transatlantic flight is not reachable on $500 budget', () => {
    expect(isAirportReachable('JFK', ['LHR'], 500)).toBe(false);
  });

  it('domestic flight is reachable on $1000 budget', () => {
    expect(isAirportReachable('JFK', ['LAX'], 1000)).toBe(true);
  });

  it('Asia Pacific is reachable on $3000 budget', () => {
    expect(isAirportReachable('JFK', ['HAN'], 3000)).toBe(true);
  });

  it('Asia Pacific is not reachable on $800 budget', () => {
    expect(isAirportReachable('JFK', ['NRT'], 800)).toBe(false);
  });
});
