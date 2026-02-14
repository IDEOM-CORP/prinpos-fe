import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Paper,
  Title,
  Text,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Alert,
  Box,
  Grid,
  Group,
  Divider,
  Badge,
  SimpleGrid,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import {
  IconAlertCircle,
  IconPrinter,
  IconMail,
  IconLock,
  IconShoppingCart,
  IconTruck,
  IconChartBar,
} from "@tabler/icons-react";
import { useAuthStore } from "../../../shared/stores/authStore";
import { ROUTES } from "../../../core/routes";
import { APP_NAME } from "../../../shared/constants";

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const form = useForm({
    initialValues: {
      email: "",
      password: "",
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Email tidak valid"),
      password: (value) =>
        value.length >= 6 ? null : "Password minimal 6 karakter",
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    setError("");

    const result = await login(values.email, values.password);

    if (result.success) {
      const currentUser = useAuthStore.getState().user;
      const role = currentUser?.role;

      if (role === "kasir") {
        navigate(ROUTES.CASHIER);
      } else if (role === "produksi") {
        navigate(ROUTES.PRODUCTION);
      } else if (role === "designer") {
        navigate(ROUTES.CREATE_ORDER);
      } else {
        navigate(ROUTES.DASHBOARD);
      }
    } else {
      setError(result.message || "Login gagal");
    }

    setLoading(false);
  };

  return (
    <Box
      style={{
        height: "100vh",
        display: "flex",
        overflow: "hidden",
      }}
    >
      <Grid
        style={{
          width: "100%",
          height: "100%",
          margin: 0,
          display: "flex",
          justifyContent: "center",
        }}
      >
        {/* Left Side - Brand Section */}
        <Grid.Col
          span={{ base: 0, md: 6 }}
          style={{
            padding: 0,
            display: "flex",
            background: "#278783",
            height: "100vh",
          }}
        >
          <Box
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "3rem",
            }}
          >
            <Stack
              align="center"
              gap="xl"
              style={{
                color: "white",
                textAlign: "center",
                maxWidth: "500px",
              }}
            >
              <IconPrinter size={64} stroke={2} />
              <Stack gap="md" align="center">
                <Title order={1} size="2.5rem" fw={600}>
                  {APP_NAME}
                </Title>
                <Text size="md" fw={400}>
                  Solusi Modern untuk Bisnis Percetakan Digital
                </Text>
              </Stack>
              <SimpleGrid
                cols={3}
                spacing="md"
                mt="lg"
                style={{ width: "100%" }}
              >
                <Paper
                  p="md"
                  radius="md"
                  style={{
                    background: "rgba(255, 255, 255, 0.15)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                  }}
                >
                  <Stack gap="sm" align="center">
                    <Box
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "8px",
                        background: "rgba(255, 255, 255, 0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconShoppingCart size={24} color="white" />
                    </Box>
                    <div style={{ textAlign: "center" }}>
                      <Text size="sm" fw={600} c="white">
                        Manajemen Order
                      </Text>
                      <Text size="xs" c="white" opacity={0.8}>
                        Kelola pesanan
                      </Text>
                    </div>
                  </Stack>
                </Paper>

                <Paper
                  p="md"
                  radius="md"
                  style={{
                    background: "rgba(255, 255, 255, 0.15)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                  }}
                >
                  <Stack gap="sm" align="center">
                    <Box
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "8px",
                        background: "rgba(255, 255, 255, 0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconTruck size={24} color="white" />
                    </Box>
                    <div style={{ textAlign: "center" }}>
                      <Text size="sm" fw={600} c="white">
                        Tracking Produksi
                      </Text>
                      <Text size="xs" c="white" opacity={0.8}>
                        Monitor progress
                      </Text>
                    </div>
                  </Stack>
                </Paper>

                <Paper
                  p="md"
                  radius="md"
                  style={{
                    background: "rgba(255, 255, 255, 0.15)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                  }}
                >
                  <Stack gap="sm" align="center">
                    <Box
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "8px",
                        background: "rgba(255, 255, 255, 0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconChartBar size={24} color="white" />
                    </Box>
                    <div style={{ textAlign: "center" }}>
                      <Text size="sm" fw={600} c="white">
                        Laporan Real-time
                      </Text>
                      <Text size="xs" c="white" opacity={0.8}>
                        Analisis bisnis
                      </Text>
                    </div>
                  </Stack>
                </Paper>
              </SimpleGrid>
            </Stack>
          </Box>
        </Grid.Col>

        {/* Right Side - Login Form */}
        <Grid.Col
          span={{ base: 12, md: 6 }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            background: "#FAF5EE",
            height: "100%",
          }}
        >
          <Box style={{ width: "100%", maxWidth: "450px" }}>
            <Paper
              withBorder
              shadow="md"
              p={40}
              radius="lg"
              style={{ background: "white" }}
            >
              <Group justify="center" mb="xl">
                <Box
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    background: "#278783",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconPrinter size={32} color="white" />
                </Box>
              </Group>

              <Title ta="center" order={2} mb="xs">
                Selamat Datang
              </Title>
              <Text c="dimmed" size="sm" ta="center" mb="xl">
                Masuk ke akun Anda untuk melanjutkan
              </Text>

              {error && (
                <Alert
                  icon={<IconAlertCircle size={16} />}
                  color="red"
                  mb="md"
                  radius="md"
                >
                  {error}
                </Alert>
              )}

              <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                  <TextInput
                    label="Email"
                    placeholder="email@example.com"
                    required
                    size="md"
                    leftSection={<IconMail size={18} />}
                    {...form.getInputProps("email")}
                  />

                  <PasswordInput
                    label="Password"
                    placeholder="Masukkan password"
                    required
                    size="md"
                    leftSection={<IconLock size={18} />}
                    {...form.getInputProps("password")}
                  />

                  <Button
                    type="submit"
                    fullWidth
                    loading={loading}
                    mt="md"
                    size="md"
                    color="aqua"
                  >
                    Masuk
                  </Button>
                </Stack>
              </form>

              <Divider label="Demo Akun" labelPosition="center" my="xl" />

              <Stack gap="md">
                <Text size="xs" c="dimmed" fw={500} mb="xs">
                  Akun Demo untuk Testing:
                </Text>
                <Stack gap="xs">
                  <Group gap="xs" wrap="nowrap">
                    <Badge
                      variant="light"
                      color="aqua"
                      size="sm"
                      style={{ minWidth: "80px" }}
                    >
                      OWNER
                    </Badge>
                    <Text size="xs" c="dimmed">
                      owner@prinpos.com / password123
                    </Text>
                  </Group>
                  <Group gap="xs" wrap="nowrap">
                    <Badge
                      variant="light"
                      color="green"
                      size="sm"
                      style={{ minWidth: "80px" }}
                    >
                      KASIR
                    </Badge>
                    <Text size="xs" c="dimmed">
                      kasir@prinpos.com / password123
                    </Text>
                  </Group>
                  <Group gap="xs" wrap="nowrap">
                    <Badge
                      variant="light"
                      color="orange"
                      size="sm"
                      style={{ minWidth: "80px" }}
                    >
                      PRODUKSI
                    </Badge>
                    <Text size="xs" c="dimmed">
                      produksi@prinpos.com / password123
                    </Text>
                  </Group>
                  <Group gap="xs" wrap="nowrap">
                    <Badge
                      variant="light"
                      color="indigo"
                      size="sm"
                      style={{ minWidth: "80px" }}
                    >
                      DESIGNER
                    </Badge>
                    <Text size="xs" c="dimmed">
                      designer@prinpos.com / password123
                    </Text>
                  </Group>
                </Stack>
              </Stack>
            </Paper>
          </Box>
        </Grid.Col>
      </Grid>
    </Box>
  );
}
