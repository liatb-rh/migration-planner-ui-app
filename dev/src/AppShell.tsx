import {
  Brand,
  Button,
  Masthead,
  MastheadBrand,
  MastheadContent,
  MastheadLogo,
  MastheadMain,
  MastheadToggle,
  Page,
  PageSection,
  PageSidebar,
  PageSidebarBody,
  PageToggleButton,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";
import MoonIcon from "@patternfly/react-icons/dist/esm/icons/moon-icon";
import SunIcon from "@patternfly/react-icons/dist/esm/icons/sun-icon";
import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import MainApp from "../../src/MainApp";
import { ChatWidget } from "../../src/ui/chat-widget";

const DARK_CLASS = "pf-v6-theme-dark";
const logoUrl = new URL("/oma-logo.svg", import.meta.url);

export const AppShell: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains(DARK_CLASS),
  );

  useEffect(() => {
    document.documentElement.classList.toggle(DARK_CLASS, isDark);
  }, [isDark]);

  const onSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const masthead = (
    <Masthead>
      <MastheadMain>
        <MastheadToggle>
          <PageToggleButton
            isHamburgerButton
            aria-label="Global navigation"
            isSidebarOpen={isSidebarOpen}
            onSidebarToggle={onSidebarToggle}
            id="vertical-nav-toggle"
          />
        </MastheadToggle>
        <MastheadBrand>
          <MastheadLogo href="/">
            <Brand
              src={logoUrl.href}
              heights={{ default: "36px" }}
              alt="OpenShift Migration Advisor"
            />
          </MastheadLogo>
        </MastheadBrand>
      </MastheadMain>
      <MastheadContent>
        <Toolbar>
          <ToolbarContent>
            <ToolbarItem align={{ default: "alignEnd" }}>
              <Button
                variant="plain"
                aria-label={
                  isDark ? "Switch to light mode" : "Switch to dark mode"
                }
                onClick={() => setIsDark((d) => !d)}
                icon={isDark ? <SunIcon /> : <MoonIcon />}
              />
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>
      </MastheadContent>
    </Masthead>
  );

  const sidebar = (
    <PageSidebar isSidebarOpen={isSidebarOpen} id="vertical-sidebar">
      <PageSidebarBody>Navigation</PageSidebarBody>
    </PageSidebar>
  );

  return (
    <>
      <Page masthead={masthead} sidebar={sidebar} isContentFilled>
        <PageSection aria-labelledby="section-1">
          <BrowserRouter
            future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
            basename="/"
          >
            <Routes>
              <Route path="/*" element={<MainApp />} />
            </Routes>
          </BrowserRouter>
        </PageSection>
      </Page>
      <div>sss</div>
      <ChatWidget />
    </>
  );
};
AppShell.displayName = "AppShell";
