import { createTheme } from "@mantine/core";
import type { MantineColorsTuple } from "@mantine/core";

const primaryColor: MantineColorsTuple = [
  "#e8f7f6",
  "#c5ece9",
  "#9eddd9",
  "#72cec8",
  "#4bbfb9",
  "#31a8a3",
  "#278783",
  "#1f6c69",
  "#175250",
  "#0e3736",
];

export const theme = createTheme({
  primaryColor: "aqua",
  colors: {
    aqua: primaryColor,
  },
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  headings: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontWeight: "600",
  },
  defaultRadius: "md",
  components: {
    Button: {
      defaultProps: {
        radius: "md",
      },
    },
    Card: {
      defaultProps: {
        radius: "md",
        shadow: "sm",
        withBorder: true,
      },
    },
    Modal: {
      defaultProps: {
        radius: "md",
        centered: true,
      },
    },
  },
});
