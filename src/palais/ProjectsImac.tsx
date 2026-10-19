import { ImacScreen } from "./LibraryImac";
import { usePortrait } from "./PortraitTerrace";

/**
 * The library's iMac on the Projects page: the same desktop, with every
 * project as an app, the README, and the Finder in the dock. The little tools
 * (GIF maker, Splitter, One line) and My favs and School stay on the Mac in the Palais.
 */
export function ProjectsImac() {
  const tall = usePortrait();
  return (
    <div className="palais imac-showcase">
      <ImacScreen
        tall={tall}
        folders={false}
        onRoom={(r) => window.location.assign(`${process.env.PUBLIC_URL}/#${r}`)}
      />
    </div>
  );
}
