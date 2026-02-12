import { useState } from "react";
import {
  Container,
  Paper,
  TextInput,
  PasswordInput,
  Button,
  Title,
  Text,
  Stack,
  Center,
  Box,
  Badge,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useNavigate } from "react-router-dom";
import { IconLock, IconMail } from "@tabler/icons-react";
import { useAuthStore } from "../../../shared/stores/authStore";
import { ROUTES } from "../../../core/routes";
import { APP_NAME } from "../../../shared/constants";

export default function SuperAdminLoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const form = useForm({
    initialValues: {
      email: "",
      password: "",
    },
    validate: {
      email: (value) => (!value ? "Email wajib diisi" : null),
      password: (value) => (!value ? "Password wajib diisi" : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    setError("");

    // In production, this would call an API
    // For now, we'll check against dummy superadmin credentials
    const superAdminEmail = "superadmin@prinpos.com";
    const superAdminPassword = "superadmin123";

    if (
      values.email === superAdminEmail &&
      values.password === superAdminPassword
    ) {
      const result = await login(values.email, values.password);

      if (result.success) {
        navigate(ROUTES.ADMIN_DASHBOARD);
      } else {
        setError(result.message || "Email atau password salah");
      }
    } else {
      setError("Email atau password salah");
    }

    setLoading(false);
  };

  return (
    <Box
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1f6c69 0%, #0e3736 100%)",
      }}
    >
      <Container size={420} my={40}>
        <Center mb="xl">
          <Stack align="center" gap="xs">
            <Title
              order={1}
              style={{
                color: "white",
                textAlign: "center",
              }}
            >
              {APP_NAME}
            </Title>
            <Badge size="lg" color="dark" variant="filled">
              Internal Admin Portal
            </Badge>
          </Stack>
        </Center>

        <Paper radius="md" p="xl" withBorder shadow="xl">
          <Title order={2} size="h3" mb="md" ta="center">
            Login Superadmin
          </Title>

          <Text size="sm" c="dimmed" ta="center" mb="xl">
            Hanya untuk pihak internal {APP_NAME}
          </Text>

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
              <TextInput
                label="Email"
                placeholder="superadmin@prinpos.com"
                leftSection={<IconMail size={16} />}
                size="md"
                {...form.getInputProps("email")}
              />

              <PasswordInput
                label="Password"
                placeholder="Password superadmin"
                leftSection={<IconLock size={16} />}
                size="md"
                {...form.getInputProps("password")}
              />

              {error && (
                <Text size="sm" c="red" ta="center">
                  {error}
                </Text>
              )}

              <Button
                type="submit"
                fullWidth
                size="md"
                loading={loading}
                color="aqua"
              >
                Login
              </Button>

              <Text size="xs" c="dimmed" ta="center">
                Credentials:{" "}
                <Text component="span" fw={500}>
                  superadmin@prinpos.com
                </Text>{" "}
                /{" "}
                <Text component="span" fw={500}>
                  superadmin123
                </Text>
              </Text>
            </Stack>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}
