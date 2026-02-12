import {
  AppShell,
  Burger,
  Group,
  Text,
  NavLink,
  Avatar,
  Menu,
  ActionIcon,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useNavigate, useLocation } from "react-router-dom";
import {
  IconDashboard,
  IconShoppingCart,
  IconTool,
  IconFileText,
  IconBox,
  IconUsers,
  IconBuilding,
  IconChartBar,
  IconLogout,
  IconUser,
} from "@tabler/icons-react";
import { useAuthStore } from "../shared/stores/authStore";
import { ROUTES } from "../core/routes";
import { APP_NAME } from "../shared/constants";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [opened, { toggle }] = useDisclosure();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  const navItems = [
    {
      label: "Dashboard",
      icon: IconDashboard,
      path: ROUTES.DASHBOARD,
      roles: ["owner"], // Only owner sees dashboard
    },
    {
      label: "Kasir",
      icon: IconShoppingCart,
      path: ROUTES.CASHIER,
      roles: ["kasir"], // Only kasir
    },
    {
      label: "Produksi",
      icon: IconTool,
      path: ROUTES.PRODUCTION,
      roles: ["produksi"], // Only produksi
    },
    {
      label: "Orders",
      icon: IconFileText,
      path: ROUTES.ORDERS,
      roles: ["owner", "kasir", "produksi"], // All roles can see orders
    },
    {
      label: "Barang",
      icon: IconBox,
      path: ROUTES.ITEMS,
      roles: ["owner"], // Only owner manages items
    },
    {
      label: "Laporan",
      icon: IconChartBar,
      path: ROUTES.REPORTS,
      roles: ["owner"], // Only owner sees reports
    },
    // Users, Organizations, and Branches moved to internal superadmin web
    // These routes still exist for backwards compatibility but not shown in sidebar
  ];

  const filteredNavItems = navItems.filter(
    (item) => user && item.roles.includes(user.role),
  );

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 280,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            <Text size="xl" fw={700} c="blue">
              {APP_NAME}
            </Text>
          </Group>

          <Menu shadow="md" width={200}>
            <Menu.Target>
              <ActionIcon variant="subtle" size="lg">
                <Avatar size="sm" radius="xl" color="blue">
                  {user?.name.charAt(0).toUpperCase()}
                </Avatar>
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label>
                {user?.name}
                <Text size="xs" c="dimmed">
                  {user?.role}
                </Text>
              </Menu.Label>
              <Menu.Divider />
              <Menu.Item
                leftSection={<IconUser size={16} />}
                onClick={() => navigate(ROUTES.DASHBOARD)}
              >
                Profile
              </Menu.Item>
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
        {filteredNavItems.map((item) => (
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
          />
        ))}
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
