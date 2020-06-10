declare function define(name: any, deps: any, factory?: any): void;
declare namespace define {
    var amd: {
        pico: boolean;
    };
}
declare function load(...names: any[]): Promise<any>;
declare const pico: {
    load: typeof load;
    define: typeof define;
};
export { load, define };
export default pico;
