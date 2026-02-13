import {
  AppShell,
  Burger,
  Group,
  Text,
  NavLink,
  Avatar,
  Menu,
  ActionIcon,
  Tooltip,
  Box,
  Divider,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useNavigate, useLocation } from "react-router-dom";
import {
  IconDashboard,
  IconShoppingCart,
  IconTool,
  IconFileText,
  IconBox,
  IconChartBar,
  IconLogout,
  IconUser,
  IconLayoutSidebar,
  IconLayoutSidebarLeftCollapse,
  IconCategory,
} from "@tabler/icons-react";
import { useAuthStore } from "../shared/stores/authStore";
import { ROUTES } from "../core/routes";
import { APP_NAME } from "../shared/constants";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpened, { toggle: toggleSidebar }] = useDisclosure(false);
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure(false);
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
      label: "Kategori",
      icon: IconCategory,
      path: ROUTES.CATEGORIES,
      roles: ["owner"], // Only owner manages categories
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
        width: sidebarOpened ? 260 : 80,
        breakpoint: "sm",
        collapsed: { mobile: !mobileOpened },
      }}
      padding="md"
      transitionDuration={300}
      transitionTimingFunction="ease"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            {/* Mobile hamburger */}
            <Burger
              opened={mobileOpened}
              onClick={toggleMobile}
              hiddenFrom="sm"
              size="sm"
            />
            {/* Desktop toggle */}
            <Tooltip
              label={sidebarOpened ? "Tutup Menu" : "Buka Menu"}
              position="right"
            >
              <ActionIcon
                variant="subtle"
                onClick={toggleSidebar}
                visibleFrom="sm"
                size="lg"
                aria-label="Toggle sidebar"
              >
                {sidebarOpened ? (
                  <IconLayoutSidebarLeftCollapse size={20} />
                ) : (
                  <IconLayoutSidebar size={20} />
                )}
              </ActionIcon>
            </Tooltip>
            <Text size="xl" fw={700} c="aqua">
              {APP_NAME}
            </Text>
          </Group>

          <Menu shadow="md" width={200}>
            <Menu.Target>
              <ActionIcon variant="subtle" size="lg">
                <Avatar size="sm" radius="xl" color="aqua">
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
                onClick={() => navigate(ROUTES.PROFILE)}
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
        <Box style={{ flex: 1 }}>
          {filteredNavItems.map((item) =>
            sidebarOpened ? (
              <NavLink
                key={item.path}
                label={item.label}
                leftSection={<item.icon size={20} stroke={1.5} />}
                active={location.pathname === item.path}
                onClick={() => {
                  navigate(item.path);
                  if (mobileOpened) toggleMobile();
                }}
                mb="xs"
              />
            ) : (
              <Tooltip
                key={item.path}
                label={item.label}
                position="right"
                withArrow
                transitionProps={{ duration: 200 }}
              >
                <ActionIcon
                  variant={location.pathname === item.path ? "light" : "subtle"}
                  color={location.pathname === item.path ? "aqua" : "gray"}
                  size="xl"
                  onClick={() => navigate(item.path)}
                  mb="xs"
                  style={{ width: "100%" }}
                >
                  <item.icon size={22} stroke={1.5} />
                </ActionIcon>
              </Tooltip>
            ),
          )}
        </Box>

        <Divider my="sm" />

        {/* User info di sidebar */}
        {sidebarOpened ? (
          <Group gap="sm" p="xs">
            <Avatar size="sm" radius="xl" color="aqua">
              {user?.name.charAt(0).toUpperCase()}
            </Avatar>
            <Box style={{ flex: 1 }}>
              <Text size="sm" fw={500} lineClamp={1}>
                {user?.name}
              </Text>
              <Text size="xs" c="dimmed" tt="capitalize">
                {user?.role}
              </Text>
            </Box>
          </Group>
        ) : (
          <Tooltip label={user?.name} position="right" withArrow>
            <ActionIcon variant="subtle" size="xl" style={{ width: "100%" }}>
              <Avatar size="sm" radius="xl" color="aqua">
                {user?.name.charAt(0).toUpperCase()}
              </Avatar>
            </ActionIcon>
          </Tooltip>
        )}
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
