import { useEffect, useState } from "react";
import { useWindowSize } from "react-use";

const DEFAULT_HEIGHT = 635;

function getMainPageSectionVerticalPadding(pageMainSection: Element): number {
  const { paddingTop, paddingBottom } = getComputedStyle(pageMainSection);
  const value =
    parseFloat(paddingTop.slice(0, -2)) +
    parseFloat(paddingBottom.slice(0, -2));

  return value;
}

export function useComputedHeightFromPageHeader(): number {
  const { height: windowInnerHeight } = useWindowSize();
  const [height, setHeight] = useState(DEFAULT_HEIGHT);

  useEffect(() => {
    const basePageHeader = document.getElementById("base-page__header");
    if (basePageHeader) {
      const pageMainSection = basePageHeader.nextElementSibling;
      if (pageMainSection) {
        const mainPageSectionVerticalPadding =
          getMainPageSectionVerticalPadding(pageMainSection);
        const { height: basePageHeaderHeight } =
          basePageHeader.getBoundingClientRect();
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHeight(
          windowInnerHeight -
            basePageHeaderHeight -
            mainPageSectionVerticalPadding,
        );
      }
    }
  }, [windowInnerHeight]);

  return height;
}
