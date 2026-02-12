import { createTheme, MantineColorsTuple } from "@mantine/core";

const primaryColor: MantineColorsTuple = [
  "#e3f2fd",
  "#bbdefb",
  "#90caf9",
  "#64b5f6",
  "#42a5f5",
  "#2196f3",
  "#1e88e5",
  "#1976d2",
  "#1565c0",
  "#0d47a1",
];

export const theme = createTheme({
  primaryColor: "blue",
  colors: {
    blue: primaryColor,
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
