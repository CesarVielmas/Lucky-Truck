import { ExpandableRow } from "@/components/ui/expandableRow";
import { Fragment } from "@/components/ui/fragment";
import ExpandedImageInnactive from "@/public/icons/right_expanded_innactive.png";
import ExpandedImageActive from "@/public/icons/left_expanded_active.png";
import ExpandedImageInnactiveHover from "@/public/icons/right_expanded_active.png"
import HistoryGraphics from "./history_graphics";
import HistoryContents from "./history_contents";

export default function UserHistory() {
  return (
    <Fragment className="h-full w-full" variant="invisibly">
      <ExpandableRow orientation="left" stylesContainer1="bg-white" stylesContainer2="bg-white" tittleContentHidden="Graficos" tittleContentVisible="Graficos Del Historial" iconActiveDesplegable={ExpandedImageActive} iconHoverDesplegable={ExpandedImageInnactiveHover} iconInnactiveDesplegable={ExpandedImageInnactive} childrenPart1={<HistoryContents />} childrenPart2={<HistoryGraphics />} />
    </Fragment>
  );
}
