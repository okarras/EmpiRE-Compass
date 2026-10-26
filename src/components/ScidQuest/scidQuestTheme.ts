import { createTheme, type Theme } from '@mui/material/styles';

/**
 * Visual language for the SciD-QuESt questionnaire, ported from the SciD-QuESt
 * demo site: slate surfaces, ORKG red accents, sections as bordered cards, and
 * quiet inputs that only pick up colour on focus.
 *
 * The demo site is light-only. EmpiRE-Compass is not, so this is derived from
 * the surrounding app theme and only substitutes the slate palette in light
 * mode — dark mode keeps the dashboard's own surfaces and inherits the same
 * shape, typography and component rules.
 */

const SLATE = {
  bg: '#f8fafc',
  bgSubtle: '#f1f5f9',
  paper: '#ffffff',
  border: '#e2e8f0',
  borderStrong: '#cbd5e1',
  text: '#1e293b',
  textMuted: '#475569',
  textFaint: '#64748b',
} as const;

/** ORKG red, matching the demo site. */
const ORKG_RED = '#EC6160';

const CARD_SHADOW = '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)';

const FONT_STACK =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

export function createScidQuestTheme(outer: Theme): Theme {
  const isLight = outer.palette.mode === 'light';

  const border = isLight ? SLATE.border : outer.palette.divider;
  const borderStrong = isLight ? SLATE.borderStrong : outer.palette.divider;
  const paper = isLight ? SLATE.paper : outer.palette.background.paper;
  const canvas = isLight ? SLATE.bg : outer.palette.background.default;
  const inputBg = isLight ? SLATE.bg : outer.palette.action.hover;
  const heading = isLight ? SLATE.text : outer.palette.text.primary;
  const muted = isLight ? SLATE.textFaint : outer.palette.text.secondary;

  return createTheme(outer, {
    palette: {
      primary: { main: isLight ? ORKG_RED : outer.palette.primary.main },
      ...(isLight
        ? {
            background: { default: SLATE.bg, paper: SLATE.paper },
            text: { primary: SLATE.text, secondary: SLATE.textMuted },
            divider: SLATE.border,
          }
        : {}),
    },
    typography: {
      fontFamily: FONT_STACK,
      // The demo runs the whole form a notch below MUI's defaults, which is
      // what makes a long questionnaire read as dense rather than shouty.
      body1: { fontSize: '0.88rem', lineHeight: 1.55 },
      body2: { fontSize: '0.82rem', lineHeight: 1.55 },
      subtitle1: { fontSize: '0.92rem', fontWeight: 700 },
      subtitle2: { fontSize: '0.85rem', fontWeight: 600 },
      caption: { fontSize: '0.78rem', color: muted },
    },
    shape: { borderRadius: 8 },
    components: {
      // Sections render as accordions; the demo shows them as flat cards, so
      // strip MUI's elevation and the divider pseudo-element it inserts.
      MuiAccordion: {
        styleOverrides: {
          root: {
            backgroundColor: paper,
            border: `1px solid ${border}`,
            borderRadius: 12,
            boxShadow: CARD_SHADOW,
            marginBottom: 14,
            '&:before': { display: 'none' },
            '&.Mui-expanded': { margin: '0 0 14px 0' },
            '&:last-of-type': { marginBottom: 0 },
          },
        },
      },
      MuiAccordionSummary: {
        styleOverrides: {
          root: {
            minHeight: 52,
            padding: '0 18px',
            '&.Mui-expanded': { minHeight: 52 },
          },
          content: {
            margin: '12px 0',
            fontSize: '0.92rem',
            fontWeight: 700,
            color: heading,
            '&.Mui-expanded': { margin: '12px 0' },
          },
        },
      },
      MuiAccordionDetails: {
        styleOverrides: {
          root: {
            padding: '4px 18px 18px',
            borderTop: `1px solid ${isLight ? SLATE.bgSubtle : border}`,
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: inputBg,
            borderRadius: 8,
            fontSize: '0.88rem',
            lineHeight: 1.55,
            '& fieldset': { borderColor: border },
            '&:hover fieldset': { borderColor: borderStrong },
            '&.Mui-focused fieldset': {
              borderColor: isLight ? ORKG_RED : outer.palette.primary.main,
              borderWidth: 1.5,
            },
          },
          input: { padding: '10px 12px' },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: { fontSize: '0.88rem', fontWeight: 500 },
        },
      },
      MuiFormLabel: {
        styleOverrides: {
          root: { fontSize: '0.88rem', fontWeight: 500, color: heading },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 6,
            minHeight: 30,
          },
          sizeSmall: { fontSize: '0.78rem' },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 600, fontSize: '0.7rem' },
        },
      },
      MuiPaper: {
        styleOverrides: {
          outlined: { borderColor: border, borderRadius: 12 },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: { fontSize: '0.75rem' },
        },
      },
      MuiCssBaseline: {
        styleOverrides: { body: { backgroundColor: canvas } },
      },
    },
  });
}
