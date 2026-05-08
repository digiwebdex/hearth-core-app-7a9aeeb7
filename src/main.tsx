import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import PortalApp from "./portal/PortalApp.tsx";
import { isPortalHost } from "./lib/domainResolver";
import "./index.css";

const Root = isPortalHost() ? PortalApp : App;

createRoot(document.getElementById("root")!).render(<Root />);
