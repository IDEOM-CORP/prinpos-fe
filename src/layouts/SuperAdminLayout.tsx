import {
  AppShell,
  Group,
  Text,
  NavLink,
  Avatar,
  Menu,
  ActionIcon,
  Badge,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useNavigate, useLocation } from "react-router-dom";
import {
  IconDashboard,
  IconBuilding,
  IconUsers,
  IconBuildingStore,
  IconLogout,
} from "@tabler/icons-react";
import { useAuthStore } from "../shared/stores/authStore";
import { ROUTES } from "../core/routes";
import { APP_NAME } from "../shared/constants";

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const [opened, { toggle }] = useDisclosure();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.ADMIN_LOGIN);
  };

  const navItems = [
    {
      label: "Dashboard",
      icon: IconDashboard,
      path: ROUTES.ADMIN_DASHBOARD,
    },
    {
      label: "Bisnis",
      icon: IconBuilding,
      path: ROUTES.ADMIN_ORGANIZATIONS,
    },
    {
      label: "Cabang",
      icon: IconBuildingStore,
      path: ROUTES.ADMIN_BRANCHES,
    },
    {
      label: "Users",
      icon: IconUsers,
      path: ROUTES.ADMIN_USERS,
    },
  ];

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 280,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      padding="md"
      styles={{
        main: {
          background: "var(--mantine-color-gray-0)",
        },
      }}
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Text size="xl" fw={700} c="red">
              {APP_NAME}
            </Text>
            <Badge color="red" variant="filled">
              Internal Admin
            </Badge>
          </Group>

          <Menu shadow="md" width={200}>
            <Menu.Target>
              <ActionIcon variant="subtle" size="lg">
                <Avatar size="sm" radius="xl" color="red">
                  {user?.name.charAt(0).toUpperCase()}
                </Avatar>
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label>
                {user?.name}
                <Text size="xs" c="dimmed">
                  Super Admin
                </Text>
              </Menu.Label>
              <Menu.Divider />
              <Menu.Item
                leftSection={<IconLogout size={16} />}
                color="red"
                onClick={handleLogout}
              >
                Logout
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            label={item.label}
            leftSection={<item.icon size={20} stroke={1.5} />}
            active={location.pathname === item.path}
            onClick={() => {
              navigate(item.path);
              if (opened) toggle();
            }}
            mb="xs"
            color="red"
          />
        ))}
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
