/**
 * What inline styles cannot do: change the layout when the editor is narrow. The rules look at the
 * width of the editor itself (a container query), not of the window, so they also apply in a narrow
 * column of a CMS admin. Rendered once inside the editor's root.
 */
export const RESPONSIVE_CSS = `
.pe-root{min-width:0}
.pe-body{container-type:inline-size;container-name:pe;min-width:0}
.pe-root *{box-sizing:border-box}
.pe-root input,.pe-root select,.pe-root textarea{max-width:100%}
.pe-scroll{overflow-x:auto;max-width:100%}
.pe-tabs{overflow-x:auto;scrollbar-width:thin}
@container pe (max-width: 44rem){
 .pe-row{grid-template-columns:minmax(0,1fr) !important;align-items:start !important}
 .pe-flow{grid-template-columns:minmax(0,1fr) !important}
 .pe-tabs button{padding-inline:.7rem !important}
}
@container pe (max-width: 28rem){
 .pe-cards{grid-template-columns:repeat(auto-fill,minmax(7.5rem,1fr)) !important}
}
`;

export function ResponsiveStyle() {
	return <style>{RESPONSIVE_CSS}</style>;
}
