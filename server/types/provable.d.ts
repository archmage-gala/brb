declare module 'provable' {
    import BigNumber from 'bignumber.js';

    type ProvableConfig = {
        id?: string;
        index?: number;
        count?: number;
        seed?: string;
        publicSeed?: string;
    };

    interface ProvableFunction {
        (opts: ProvableConfig): any;
        toBool: (hash: string, chance: BigNumber) => boolean;
    }

    const Provable: ProvableFunction;
    export default Provable;
}