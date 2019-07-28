export class CtrlInfo {
    public panel: {
        current: string,
        previous: string,
        panel_alive: boolean,
        scrolltop: number,
    };
    constructor() {
        this.panel = {
            current :"",
            previous: "",
            panel_alive: false,
            scrolltop: 0,
        }
    }
}