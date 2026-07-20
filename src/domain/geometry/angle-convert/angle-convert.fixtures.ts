/**
 * Hand-derived compass<->math conversion and normalization fixtures (D-13).
 */

// compassToMathDegrees(compass) = normalizeCompassDegrees(90 - compass).
// Compass north (0) points along the standard math +y/90-degree axis:
// 90 - 0 = 90.
export const compassNorthToMathCase = { compassDegrees: 0, expectedMathDegrees: 90 };

// Compass east (90) points along the standard math +x/0-degree axis:
// 90 - 90 = 0.
export const compassEastToMathCase = { compassDegrees: 90, expectedMathDegrees: 0 };

// Compass south (180): 90 - 180 = -90, normalized into [0,360) => 270.
export const compassSouthToMathCase = { compassDegrees: 180, expectedMathDegrees: 270 };

// mathToCompassDegrees(0) = normalizeCompassDegrees(90 - 0) = 90.
export const mathZeroToCompassCase = { mathDegrees: 0, expectedCompassDegrees: 90 };

// Round-trip self-inverse samples: mathToCompassDegrees(compassToMathDegrees(x)) ~= x.
export const roundTripSamples = [45, 200];

// normalizeCompassDegrees fixtures:
// -10 => -10 + 360 = 350.
export const normalizeNegativeCase = { input: -10, expected: 350 };
// 360 => 360 % 360 = 0.
export const normalizeUpperBoundaryCase = { input: 360, expected: 0 };
// 720.5 => 720.5 % 360 = 0.5.
export const normalizeOverflowCase = { input: 720.5, expected: 0.5 };

// normalizeRelativeBearingDegrees fixtures ((-180, 180], D-08 upper-inclusive):
// 180 stays 180 (upper-inclusive boundary).
export const relativeBearingUpperBoundaryCase = { input: 180, expected: 180 };
// -180 remaps to 180 (the -180/180 seam is defined as +180, not -180).
export const relativeBearingLowerSeamCase = { input: -180, expected: 180 };
// 270 => 270 - 360 = -90.
export const relativeBearingWrapCase = { input: 270, expected: -90 };
